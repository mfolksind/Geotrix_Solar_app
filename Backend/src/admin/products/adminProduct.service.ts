import { ProductRepository } from '../../modules/products/product.repository';
import { ProductVariantRepository } from '../../modules/products/productVariant.repository';
import { ProductImageRepository } from '../../modules/products/productImage.repository';
import { ProductService } from '../../modules/products/product.service';

export class AdminProductService {
  private repo = new ProductRepository();
  private variantRepo = new ProductVariantRepository();
  private imageRepo = new ProductImageRepository();
  private service = new ProductService(this.repo, this.variantRepo, this.imageRepo);

  public async getAll(query: any) {
    return this.repo.findAll(query);
  }

  public async create(payload: any) {
    return this.service.createProduct(payload);
  }

  public async update(id: string, payload: any) {
    return this.service.updateProduct(id, payload);
  }

  public async delete(id: string) {
    return this.service.deleteProduct(id);
  }

  public async changeStatus(id: string, status: string) {
    return this.repo.update(id, { status } as any);
  }

  public async uploadImage(payload: any) {
    return this.service.uploadImage(payload);
  }

  public async deleteImage(id: string) {
    return this.service.deleteImage(id);
  }

  public async getVariants(productId: string) {
    return this.service.getVariants(productId);
  }

  public async createVariant(productId: string, payload: any) {
    return this.service.createVariant(productId, payload);
  }

  public async updateVariant(id: string, payload: any) {
    return this.service.updateVariant(id, payload);
  }

  public async deleteVariant(id: string) {
    return this.service.deleteVariant(id);
  }

  public async getProduct(id: string) {
    const product = await this.repo.findById(id);
    if (!product) return null;
    const variants = await this.service.getVariants(id);
    return {
      ...(product.toObject ? product.toObject() : product),
      variants
    };
  }

  public async setDefaultVariant(productId: string, variantId: string) {
    return this.service.setDefaultVariant(productId, variantId);
  }

  public async setPrimaryImage(variantId: string, imageId: string) {
    return this.service.setPrimaryImage(variantId, imageId);
  }

  public async getStats() {
    const ProductModel = (await import('../../modules/products/product.model')).default;
    const ProductVariantModel = (await import('../../modules/products/productVariant.model')).default;
    const [totalProducts, activeProducts, totalVariants, outOfStockCount, lowStockCount] = await Promise.all([
      ProductModel.countDocuments({ isDeleted: false }),
      ProductModel.countDocuments({ isDeleted: false, status: 'ACTIVE' }),
      ProductVariantModel.countDocuments({ isDeleted: false }),
      ProductVariantModel.countDocuments({ isDeleted: false, stock: { $lte: 0 } }),
      ProductVariantModel.countDocuments({ isDeleted: false, stock: { $gt: 0, $lte: 5 } }),
    ]);

    return {
      totalProducts,
      activeProducts,
      totalVariants,
      outOfStockCount,
      lowStockCount
    };
  }
}
