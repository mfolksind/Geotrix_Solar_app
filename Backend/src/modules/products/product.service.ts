import { Types } from 'mongoose';
import { ProductRepository } from './product.repository';
import { ProductVariantRepository } from './productVariant.repository';
import { ProductImageRepository } from './productImage.repository';
import ProductModel from './product.model';
import ProductVariantModel from './productVariant.model';
import ProductImageModel from './productImage.model';
import { CreateProductPayload, UpdateProductPayload, CreateVariantPayload, UpdateVariantPayload, UploadImagePayload, ListProductsQuery } from './product.types';

function generateSlug(input: string): string {
  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class ProductService {
  constructor(
    private readonly repo: ProductRepository,
    private readonly variantRepo: ProductVariantRepository,
    private readonly imageRepo: ProductImageRepository
  ) {}

  public async createProduct(payload: CreateProductPayload) {
    return this.repo.create(payload as any);
  }

  public async updateProduct(id: string, payload: UpdateProductPayload) {
    return this.repo.update(id, payload as any);
  }

  public async deleteProduct(id: string) {
    return this.repo.softDelete(id);
  }

  public async getProduct(identifier: string) {
    let variant = await this.variantRepo.findByIdOrSlug(identifier);
    if (!variant) {
      // Check if identifier is a product ID
      const product = await this.repo.findById(identifier);
      if (product) {
        const variants = await this.variantRepo.findByProduct(String(product._id || product.id));
        variant = (variants.find((v: any) => v.isDefault && v.status === 'ACTIVE') || variants.find((v: any) => v.isDefault) || variants[0]) as any;
      }
    }
    if (variant) {
      await variant.populate(['relatedSystems', 'compatibleProducts', 'recommendedProducts']);
      const images = await this.imageRepo.findByVariant(String(variant._id || variant.id));
      return { ...(variant.toObject ? variant.toObject() : variant), images };
    }
    return null;
  }

  public async getRelatedProducts(identifier: string, limit: number = 4) {
    let variant = await this.variantRepo.findByIdOrSlug(identifier);
    if (!variant) {
      const product = await this.repo.findById(identifier);
      if (product) {
        const variants = await this.variantRepo.findByProduct(String(product._id || product.id));
        variant = (variants.find((v: any) => v.isDefault) || variants[0]) as any;
      }
    }
    if (!variant) return [];
    
    // We assume variant.product might be populated
    const product = typeof variant.product === 'object' ? (variant.product as any) : await this.repo.findById(variant.product.toString());
    const categoryId = product && product.category ? (product.category._id || product.category).toString() : undefined;
    const productId = typeof variant.product === 'object' ? (variant.product as any)._id : variant.product;
    const related = await this.variantRepo.findRelated(productId.toString(), categoryId, limit);
    
    // Attach images
    return Promise.all(related.map(async (v: any) => {
      const images = await this.imageRepo.findByVariant(String(v._id || v.id));
      return { ...(v.toObject ? v.toObject() : v), images };
    }));
  }

  /**
   * List Products for Client Storefront:
   * Returns ONE item per Product with its default (or primary active) variant and images attached.
   */
  public async listProducts(query: ListProductsQuery) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.max(1, Number(query.limit || 20));

    // Base filter for products
    const productFilter: any = { isDeleted: false };

    // Status filter
    if (query.status && (query.status as string) !== 'ALL') {
      productFilter.status = query.status;
    } else if (!query.status) {
      productFilter.status = 'ACTIVE';
    }

    // Family filter
    if (query.family) {
      productFilter.family = query.family;
    }

    // Category filter (handles ObjectId or slug)
    if (query.category) {
      if (Types.ObjectId.isValid(query.category)) {
        productFilter.category = query.category;
      } else {
        const CategoryModel = (await import('../categories/category.model')).default;
        const cat = await CategoryModel.findOne({ slug: query.category, isDeleted: false });
        if (cat) {
          productFilter.category = cat._id;
        } else {
          productFilter.category = new Types.ObjectId();
        }
      }
    }

    const andConditions: any[] = [];

    // Search filter: matches Product name OR any variant's name / sku / slug / description
    if (query.search && query.search.trim()) {
      const reg = new RegExp(query.search.trim(), 'i');
      const matchingVariants = await ProductVariantModel.find({
        isDeleted: false,
        $or: [
          { variantName: reg },
          { sku: reg },
          { slug: reg },
          { description: reg }
        ]
      }).select('product').lean().exec();

      const variantProductIds = matchingVariants.map(v => v.product);
      andConditions.push({
        $or: [
          { name: reg },
          { _id: { $in: variantProductIds } }
        ]
      });
    }

    // Price filter (minPrice / maxPrice)
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceCondition: any = {};
      if (query.minPrice !== undefined) priceCondition.$gte = query.minPrice;
      if (query.maxPrice !== undefined) priceCondition.$lte = query.maxPrice;

      const matchingVariants = await ProductVariantModel.find({
        isDeleted: false,
        $or: [
          { discountPrice: priceCondition },
          { discountPrice: { $exists: false }, price: priceCondition },
          { discountPrice: null, price: priceCondition }
        ]
      }).select('product').lean().exec();

      const variantProductIds = matchingVariants.map(v => v.product);
      andConditions.push({ _id: { $in: variantProductIds } });
    }

    // inStock filter
    if (query.inStock) {
      const inStockVariants = await ProductVariantModel.find({
        isDeleted: false,
        stock: { $gt: 0 }
      }).select('product').lean().exec();

      const inStockProductIds = inStockVariants.map(v => v.product);
      andConditions.push({ _id: { $in: inStockProductIds } });
    }

    if (andConditions.length > 0) {
      productFilter.$and = andConditions;
    }

    // Sorting
    let sortOption: any = { createdAt: -1 };
    if (query.sort) {
      const [field, dir] = query.sort.split(':');
      const direction = dir === 'desc' ? -1 : 1;
      if (field === 'name') {
        sortOption = { name: direction };
      } else if (field === 'createdAt') {
        sortOption = { createdAt: direction };
      }
    }

    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      ProductModel.find(productFilter)
        .populate('category', 'name slug')
        .populate('family', 'name slug')
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      ProductModel.countDocuments(productFilter).exec()
    ]);

    // Fetch all variants for these products
    const productIds = products.map(p => p._id);
    const variants = await ProductVariantModel.find({
      product: { $in: productIds },
      isDeleted: false
    })
      .populate({
        path: 'product',
        populate: [
          { path: 'family', select: 'name slug' },
          { path: 'category', select: 'name slug' }
        ]
      })
      .populate('relatedSystems', 'variantName sku slug price discountPrice thumbnail product')
      .populate('compatibleProducts', 'variantName sku slug price discountPrice thumbnail product')
      .populate('recommendedProducts', 'variantName sku slug price discountPrice thumbnail product')
      .lean()
      .exec();

    // Fetch all images for these variants
    const variantIds = variants.map(v => v._id);
    const allImages = await this.imageRepo.findByVariantIds(variantIds.map(String));

    const imageMap = new Map<string, any[]>();
    for (const img of allImages) {
      const varId = String(img.variant);
      if (!imageMap.has(varId)) imageMap.set(varId, []);
      imageMap.get(varId)!.push(img);
    }

    const items = products.map((product: any) => {
      const prodVariants = variants.filter(v => String((v.product as any)?._id || v.product) === String(product._id));
      
      // Determine the default variant (or first active variant)
      const defaultVariant =
        prodVariants.find(v => v.isDefault && v.status === 'ACTIVE') ||
        prodVariants.find(v => v.isDefault) ||
        prodVariants.find(v => v.status === 'ACTIVE') ||
        prodVariants[0] ||
        null;

      let minPrice = Infinity;
      let maxPrice = 0;
      let totalStock = 0;

      for (const v of prodVariants) {
        totalStock += (v.stock || 0);
        const p = v.discountPrice || v.price || 0;
        if (p < minPrice) minPrice = p;
        if (p > maxPrice) maxPrice = p;
      }
      if (minPrice === Infinity) minPrice = 0;

      const vImages = defaultVariant ? (imageMap.get(String(defaultVariant._id)) || []) : [];
      const thumbnail = defaultVariant?.thumbnail || vImages.find((i: any) => i.isPrimary)?.url || vImages[0]?.url || null;

      return {
        _id: defaultVariant ? defaultVariant._id : product._id,
        productId: product._id,
        variantName: defaultVariant ? defaultVariant.variantName : product.name,
        name: product.name,
        slug: defaultVariant?.slug || '',
        sku: defaultVariant?.sku || '',
        price: defaultVariant?.price || minPrice || 0,
        discountPrice: defaultVariant?.discountPrice,
        stock: defaultVariant?.stock ?? totalStock,
        unit: defaultVariant?.unit || 'pcs',
        availableUnits: defaultVariant?.availableUnits?.length
          ? defaultVariant.availableUnits
          : [defaultVariant?.unit || 'pcs'],
        unitPrices: defaultVariant?.unitPrices || [],
        thumbnail,
        images: vImages.map((img: any) => ({
          _id: img._id,
          url: img.url,
          isPrimary: img.isPrimary,
          publicId: img.publicId
        })),
        shortDescription: defaultVariant?.shortDescription,
        description: defaultVariant?.description,
        isDefault: true,
        status: defaultVariant?.status || product.status,
        variantsCount: prodVariants.length,
        totalStock,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        product: {
          _id: product._id,
          name: product.name,
          family: product.family,
          category: product.category,
          status: product.status
        },
        relatedSystems: defaultVariant?.relatedSystems || [],
        compatibleProducts: defaultVariant?.compatibleProducts || [],
        recommendedProducts: defaultVariant?.recommendedProducts || [],
        createdAt: defaultVariant?.createdAt || product.createdAt,
        updatedAt: defaultVariant?.updatedAt || product.updatedAt
      };
    });

    // Handle in-memory sort by price if requested
    if (query.sort === 'price:asc') {
      items.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
    } else if (query.sort === 'price:desc') {
      items.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
    }

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1
    };
  }

  public async getVariants(identifier: string) {
    let productId = identifier;
    if (!identifier.match(/^[0-9a-fA-F]{24}$/)) { // If it's a slug
       const variant = await this.variantRepo.findBySlug(identifier);
       if (variant) {
          productId = typeof variant.product === 'object' ? (variant.product as any)._id.toString() : variant.product.toString();
       }
    } else {
       const product = await this.repo.findById(identifier);
       if (!product) {
          const variant = await this.variantRepo.findById(identifier);
          if (variant) {
             productId = typeof variant.product === 'object' ? (variant.product as any)._id.toString() : variant.product.toString();
          }
       }
    }

    const variants = await this.variantRepo.findByProduct(productId);
    
    // Fetch images for all variants
    const variantsWithImages = await Promise.all(
      variants.map(async (v) => {
        const images = await this.imageRepo.findByVariant(String(v.id || v._id));
        return {
          ...(v.toObject ? v.toObject() : v),
          images,
        };
      })
    );
    
    return variantsWithImages;
  }

  public async createVariant(productId: string, payload: CreateVariantPayload) {
    const product = await this.repo.findById(productId);
    if (!product) throw new Error('Product not found');

    let slug = payload.slug;
    if (!slug) {
       slug = generateSlug(`${product.name} ${payload.variantName}`);
    } else {
       slug = generateSlug(slug);
    }
    
    let existing = await this.variantRepo.findBySlug(slug);
    if (existing) {
       slug = `${slug}-${Math.floor(Math.random() * 10000)}`;
    }

    const toCreate = { ...payload, slug, product: productId };
    return this.variantRepo.create(toCreate as any);
  }

  public async updateVariant(id: string, payload: UpdateVariantPayload) {
    if (payload.slug) {
      payload.slug = generateSlug(payload.slug);
      const existing = await this.variantRepo.findBySlug(payload.slug);
      if (existing && existing.id !== id) {
         payload.slug = `${payload.slug}-${Math.floor(Math.random() * 10000)}`;
      }
    }
    return this.variantRepo.update(id, payload as any);
  }

  public async deleteVariant(id: string) {
    return this.variantRepo.delete(id);
  }

  public async uploadImage(payload: UploadImagePayload) {
    const image = await this.imageRepo.create({ variant: payload.variantId, url: payload.url, publicId: payload.publicId, isPrimary: !!payload.isPrimary, sortOrder: payload.sortOrder ?? 0 });
    
    if (payload.isPrimary) {
      await this.variantRepo.update(payload.variantId, { thumbnail: payload.url } as any);
    } else {
      // If no thumbnail exists, set it
      const variant = await this.variantRepo.findById(payload.variantId);
      if (variant && !variant.thumbnail) {
        await this.variantRepo.update(payload.variantId, { thumbnail: payload.url } as any);
      }
    }
    return image;
  }

  public async setDefaultVariant(productId: string, variantId: string) {
    return this.variantRepo.setDefaultVariant(productId, variantId);
  }

  public async setPrimaryImage(variantId: string, imageId: string) {
    const img = await this.imageRepo.setPrimaryImage(variantId, imageId);
    if (img && img.url) {
      await this.variantRepo.update(variantId, { thumbnail: img.url } as any);
    }
    return img;
  }

  public async deleteImage(id: string) {
    return this.imageRepo.delete(id);
  }
}
