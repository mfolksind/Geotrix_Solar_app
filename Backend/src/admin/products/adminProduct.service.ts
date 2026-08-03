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
    return this.service.listProducts(query);
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
}
