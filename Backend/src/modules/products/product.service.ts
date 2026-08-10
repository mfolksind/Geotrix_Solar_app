import { ProductRepository } from './product.repository';
import { ProductVariantRepository } from './productVariant.repository';
import { ProductImageRepository } from './productImage.repository';
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
    const variant = await this.variantRepo.findByIdOrSlug(identifier);
    if (variant) {
      await variant.populate(['relatedSystems', 'compatibleProducts', 'recommendedProducts']);
      const images = await this.imageRepo.findByVariant(String(variant._id || variant.id));
      return { ...(variant.toObject ? variant.toObject() : variant), images };
    }
    return this.repo.findById(identifier);
  }

  public async getRelatedProducts(identifier: string, limit: number = 4) {
    const variant = await this.variantRepo.findByIdOrSlug(identifier);
    if (!variant) return [];
    const categoryId = variant.category ? variant.category.toString() : undefined;
    const product = typeof variant.product === 'object' ? (variant.product as any)._id : variant.product;
    const related = await this.variantRepo.findRelated(product.toString(), categoryId, limit);
    
    // Attach images
    return Promise.all(related.map(async (v: any) => {
      const images = await this.imageRepo.findByVariant(String(v._id || v.id));
      return { ...(v.toObject ? v.toObject() : v), images };
    }));
  }

  public async listProducts(query: ListProductsQuery) {
    const sort = parseSort(query.sort);
    const page = query.page ? Math.max(1, Number(query.page)) : 1;
    const limit = query.limit ? Math.max(1, Number(query.limit)) : 20;

    const { data: variants, total } = await this.variantRepo.findAll({ 
      search: query.search, 
      category: query.category, 
      status: query.status, 
      page, 
      limit, 
      sort,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      inStock: query.inStock
    });
    
    // Fetch images for all variants
    const variantsWithImages = await Promise.all(
      variants.map(async (v: any) => {
        const images = await this.imageRepo.findByVariant(v._id);
        return {
          ...(v.toObject ? v.toObject() : v),
          images,
        };
      })
    );
    
    return {
      data: variantsWithImages,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
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
        const images = await this.imageRepo.findByVariant(v.id);
        return {
          ...v.toObject(),
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

  public async deleteImage(id: string) {
    return this.imageRepo.delete(id);
  }
}

function parseSort(sort?: string): any {
  if (!sort) return undefined;
  const [field, dir] = sort.split(':');
  return { [field]: dir === 'desc' ? -1 : 1 };
}
