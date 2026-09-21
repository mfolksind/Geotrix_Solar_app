import ProductVariantModel from './productVariant.model';
import { IProductVariantDocument } from './product.interface';
import { Types } from 'mongoose';
import ProductModel from './product.model';

export class ProductVariantRepository {
  public async create(payload: Partial<IProductVariantDocument>) {
    return ProductVariantModel.create(payload as Partial<IProductVariantDocument>);
  }

  public async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) return null;
    return ProductVariantModel.findById(id).exec();
  }

  public async findBySku(sku: string) {
    return ProductVariantModel.findOne({ sku }).exec();
  }

  public async findByProduct(productId: string, options: { search?: string; status?: string; sort?: any } = {}) {
    const q: any = { product: productId, isDeleted: false };
    if (options.status) q.status = options.status;
    if (options.search) {
      const reg = new RegExp(options.search.trim(), 'i');
      q.$or = [{ variantName: reg }, { sku: reg }, { slug: reg }];
    }
    let query = ProductVariantModel.find(q)
      .populate({
        path: 'product',
        populate: [
          { path: 'family', select: 'name slug' },
          { path: 'category', select: 'name slug' }
        ]
      })
      .populate('relatedSystems', 'variantName sku slug price discountPrice thumbnail product')
      .populate('compatibleProducts', 'variantName sku slug price discountPrice thumbnail product')
      .populate('recommendedProducts', 'variantName sku slug price discountPrice thumbnail product');

    if (options.sort) {
      query = query.sort(options.sort);
    } else {
      query = query.sort({ isDefault: -1, createdAt: 1 });
    }
    return query.exec();
  }

  public async findBySlug(slug: string) {
    return ProductVariantModel.findOne({ slug, isDeleted: false })
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
      .exec();
  }

  public async findByIdOrSlug(identifier: string) {
    if (Types.ObjectId.isValid(identifier)) {
      const variant = await ProductVariantModel.findById(identifier)
        .where({ isDeleted: false })
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
        .exec();
      if (variant) return variant;
    }
    return ProductVariantModel.findOne({ slug: identifier, isDeleted: false })
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
      .exec();
  }

  public async findAll(query: { search?: string; category?: string; status?: string; family?: string; product?: string; isDefault?: boolean; page?: number; limit?: number; sort?: any; minPrice?: number; maxPrice?: number; inStock?: boolean }) {
    const q: any = { isDeleted: false };
    if (query.isDefault !== undefined) {
      q.isDefault = query.isDefault;
    }
    if (query.status) q.status = query.status;
    if (query.product) q.product = query.product;
    
    const andConditions: any[] = [];

    if (query.search) {
      const reg = new RegExp(query.search.trim(), 'i');
      andConditions.push({
        $or: [
          { variantName: reg },
          { sku: reg },
          { slug: reg },
          { description: reg }
        ]
      });
    }
    
    if (query.family || query.category) {
      const pQuery: any = { isDeleted: false };
      if (query.family) pQuery.family = query.family;
      if (query.category) pQuery.category = query.category;
      const products = await ProductModel.find(pQuery).select('_id').lean().exec();
      const productIds = products.map((p: any) => p._id);
      q.product = { $in: productIds };
    }
    
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const priceCondition: any = {};
      if (query.minPrice !== undefined) priceCondition.$gte = query.minPrice;
      if (query.maxPrice !== undefined) priceCondition.$lte = query.maxPrice;
      
      andConditions.push({
        $or: [
          { discountPrice: priceCondition },
          { discountPrice: { $exists: false }, price: priceCondition },
          { discountPrice: null, price: priceCondition }
        ]
      });
    }
    
    if (query.inStock) {
      q.stock = { $gt: 0 };
    }

    if (andConditions.length > 0) {
      q.$and = andConditions;
    }

    const page = Math.max(1, query.page ?? 1);
    const limit = Math.max(1, query.limit ?? 20);
    const skip = (page - 1) * limit;

    let cursor = ProductVariantModel.find(q)
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
      .skip(skip)
      .limit(limit);
    if (query.sort) cursor = cursor.sort(query.sort);
    else cursor = cursor.sort({ createdAt: -1 });
    
    const [data, total] = await Promise.all([
      cursor.exec(),
      ProductVariantModel.countDocuments(q).exec()
    ]);

    return { data, total };
  }

  public async setDefaultVariant(productId: string, variantId: string) {
    await ProductVariantModel.updateMany(
      { product: productId, _id: { $ne: variantId } },
      { $set: { isDefault: false } }
    ).exec();
    return ProductVariantModel.findByIdAndUpdate(
      variantId,
      { $set: { isDefault: true } },
      { new: true }
    ).exec();
  }

  public async findRelated(productId: string, categoryId?: string, limit: number = 4) {
    const q: any = { isDeleted: false, product: { $ne: productId }, isDefault: true };
    if (categoryId) {
      const products = await ProductModel.find({ category: categoryId }).select('_id').lean().exec();
      q.product = { $in: products.map((p: any) => p._id), $ne: productId };
    }
    return ProductVariantModel.find(q).populate('product').limit(limit).exec();
  }

  public async update(id: string, update: Partial<IProductVariantDocument>) {
    return ProductVariantModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  public async delete(id: string) {
    return ProductVariantModel.findByIdAndUpdate(id, { isDeleted: true, status: 'INACTIVE' }, { new: true }).exec();
  }
}
