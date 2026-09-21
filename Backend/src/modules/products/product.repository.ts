import ProductModel from './product.model';
import ProductVariantModel from './productVariant.model';
import ProductImageModel from './productImage.model';
import { IProductDocument } from './product.interface';
import { Types } from 'mongoose';

export class ProductRepository {
  public async create(payload: Partial<IProductDocument>) {
    const created = await ProductModel.create(payload as Partial<IProductDocument>);
    return ProductModel.findById(created._id)
      .populate('category', 'name slug')
      .populate('family', 'name slug')
      .exec();
  }

  public async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return ProductModel.findById(id)
      .where({ isDeleted: false })
      .populate('category', 'name slug')
      .populate('family', 'name slug')
      .exec();
  }

  public async findAll(query: any = {}) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.max(1, Number(query.limit ?? 20));
    const { search, status, family, category, stockStatus, sort } = query;
    
    const filter: any = { isDeleted: false };
    
    if (status) {
      filter.status = status;
    }
    if (family && Types.ObjectId.isValid(family)) {
      filter.family = family;
    }
    if (category && Types.ObjectId.isValid(category)) {
      filter.category = category;
    }

    // If search term provided, search product name OR search variants matching SKU/name/slug
    if (search && String(search).trim()) {
      const searchRegex = new RegExp(String(search).trim(), 'i');
      const matchingVariants = await ProductVariantModel.find({
        isDeleted: false,
        $or: [
          { variantName: searchRegex },
          { sku: searchRegex },
          { slug: searchRegex }
        ]
      }).select('product').lean().exec();
      
      const variantProductIds = matchingVariants.map(v => v.product);
      filter.$or = [
        { name: searchRegex },
        { _id: { $in: variantProductIds } }
      ];
    }

    let queryObj = ProductModel.find(filter)
      .populate('category', 'name slug')
      .populate('family', 'name slug');
    
    if (sort) {
      const [field, order] = String(sort).split(':');
      queryObj = queryObj.sort({ [field]: order === 'desc' ? -1 : 1 });
    } else {
      queryObj = queryObj.sort({ createdAt: -1 });
    }

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      queryObj.skip(skip).limit(limit).lean().exec(),
      ProductModel.countDocuments(filter).exec()
    ]);

    // Attach summary stats (variantsCount, totalStock, priceRange, defaultVariant)
    const productIds = products.map(p => p._id);
    const variants = await ProductVariantModel.find({
      product: { $in: productIds },
      isDeleted: false
    }).lean().exec();

    // Fetch primary images for these variants
    const variantIds = variants.map(v => v._id);
    const images = await ProductImageModel.find({
      variant: { $in: variantIds }
    }).sort({ isPrimary: -1, sortOrder: 1 }).lean().exec();

    const imageMap = new Map<string, any[]>();
    for (const img of images) {
      const varId = String(img.variant);
      if (!imageMap.has(varId)) imageMap.set(varId, []);
      imageMap.get(varId)!.push(img);
    }

    const enrichedItems = products.map((product: any) => {
      const prodVariants = variants.filter(v => String(v.product) === String(product._id));
      const variantsCount = prodVariants.length;
      let totalStock = 0;
      let minPrice = Infinity;
      let maxPrice = 0;
      let defaultVariant = prodVariants.find(v => v.isDefault) || prodVariants[0] || null;

      for (const v of prodVariants) {
        totalStock += (v.stock || 0);
        const p = v.discountPrice || v.price || 0;
        if (p < minPrice) minPrice = p;
        if (p > maxPrice) maxPrice = p;
      }

      if (minPrice === Infinity) minPrice = 0;

      let thumbnail = defaultVariant?.thumbnail;
      if (defaultVariant && !thumbnail) {
        const vImages = imageMap.get(String(defaultVariant._id)) || [];
        thumbnail = vImages.find(i => i.isPrimary)?.url || vImages[0]?.url;
      }

      return {
        ...product,
        variantsCount,
        totalStock,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        defaultVariant: defaultVariant ? {
          _id: defaultVariant._id,
          variantName: defaultVariant.variantName,
          sku: defaultVariant.sku,
          price: defaultVariant.price,
          discountPrice: defaultVariant.discountPrice,
          stock: defaultVariant.stock,
          thumbnail
        } : null,
        thumbnail: thumbnail || null
      };
    });

    let items = enrichedItems;
    if (stockStatus) {
      if (stockStatus === 'in_stock') {
        items = items.filter(p => p.totalStock > 0);
      } else if (stockStatus === 'low_stock') {
        items = items.filter(p => p.totalStock > 0 && p.totalStock <= 10);
      } else if (stockStatus === 'out_of_stock') {
        items = items.filter(p => p.totalStock === 0);
      }
    }

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public async update(id: string, update: Partial<IProductDocument>) {
    return ProductModel.findByIdAndUpdate(id, update, { new: true })
      .populate('category', 'name slug')
      .populate('family', 'name slug')
      .exec();
  }

  public async softDelete(id: string) {
    await ProductVariantModel.updateMany({ product: id }, { isDeleted: true, status: 'INACTIVE' }).exec();
    return ProductModel.findByIdAndUpdate(id, { isDeleted: true, status: 'INACTIVE' }, { new: true }).exec();
  }
}
