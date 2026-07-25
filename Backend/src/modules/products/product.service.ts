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
    const slug = payload.slug && payload.slug.trim().length ? generateSlug(payload.slug) : generateSlug(payload.name);
    const existing = await this.repo.findBySlug(slug);
    if (existing) throw new Error('Product slug already exists');

    const toCreate = { ...payload, slug } as Partial<CreateProductPayload>;
    return this.repo.create(toCreate as any);
  }

  public async updateProduct(id: string, payload: UpdateProductPayload) {
    if (payload.slug) payload.slug = generateSlug(payload.slug);
    if (payload.name) {
      // optional: enforce name uniqueness
    }
    return this.repo.update(id, payload as any);
  }

  public async deleteProduct(id: string) {
    return this.repo.softDelete(id);
  }

  public async getProduct(id: string) {
    const product = await this.repo.findById(id);
    return product;
  }

  public async listProducts(query: ListProductsQuery) {
    const sort = parseSort(query.sort);
    return this.repo.findAll({ search: query.search, category: query.category, status: query.status, page: query.page, limit: query.limit, sort });
  }

  public async createVariant(productId: string, payload: CreateVariantPayload) {
    // ensure product exists
    const product = await this.repo.findById(productId);
    if (!product) throw new Error('Product not found');

    const toCreate = { ...payload, product: productId };
    return this.variantRepo.create(toCreate as any);
  }

  public async updateVariant(id: string, payload: UpdateVariantPayload) {
    return this.variantRepo.update(id, payload as any);
  }

  public async deleteVariant(id: string) {
    return this.variantRepo.delete(id);
  }

  public async uploadImage(payload: UploadImagePayload) {
    return this.imageRepo.create({ variant: payload.variantId, url: payload.url, publicId: payload.publicId, isPrimary: !!payload.isPrimary, sortOrder: payload.sortOrder ?? 0 });
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
