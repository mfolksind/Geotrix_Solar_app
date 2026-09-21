import crypto from 'crypto';
import { CategoryRepository } from './category.repository';
import CategoryModel from './category.model';
import FamilyModel from '../families/family.model';
import ProductModel from '../products/product.model';
import { CreateCategoryPayload, UpdateCategoryPayload, CategoryQueryParams } from './category.types';

function generateSlug(input: string): string {
  if (!input || !input.toString().trim().length) {
    throw new Error('Slug input is required');
  }

  return input
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class CategoryService {
  constructor(private readonly repo: CategoryRepository) {}

  public async getStats() {
    const [totalCategories, activeCategories, distinctFamilies, totalProducts] = await Promise.all([
      CategoryModel.countDocuments({ isDeleted: false }),
      CategoryModel.countDocuments({ isDeleted: false, status: 'ACTIVE' }),
      CategoryModel.distinct('family', { isDeleted: false, family: { $ne: null } }),
      ProductModel.countDocuments({ isDeleted: false, category: { $ne: null } }),
    ]);

    return {
      totalCategories,
      activeCategories,
      familiesLinked: distinctFamilies.length,
      totalProducts,
    };
  }

  public async createCategory(payload: CreateCategoryPayload) {
    const nameExists = await this.repo.findByName(payload.name);
    if (nameExists) throw new Error('Category name already exists');

    const slugSource = payload.slug && payload.slug.trim().length ? payload.slug : payload.name;
    const slug = generateSlug(slugSource);
    const slugExists = await this.repo.findBySlug(slug);
    if (slugExists) throw new Error('Category slug already exists');

    const toCreate = {
      name: payload.name,
      slug,
      description: payload.description || undefined,
      image: payload.image || undefined,
      family: payload.family || undefined,
      sortOrder: payload.sortOrder ?? 0,
      status: payload.status || 'ACTIVE',
      createdBy: payload.createdBy,
    };

    return this.repo.create(toCreate as any);
  }

  public async updateCategory(id: string, payload: UpdateCategoryPayload) {
    if (payload.name) {
      const other = await this.repo.findByName(payload.name);
      if (other && (other as any)._id?.toString() !== id) throw new Error('Category name already exists');
    }

    if (payload.slug) {
      const slug = generateSlug(payload.slug);
      const other = await this.repo.findBySlug(slug);
      if (other && (other as any)._id?.toString() !== id) throw new Error('Category slug already exists');
      payload.slug = slug;
    }

    const updateData: any = { ...payload };
    if (updateData.family === '') {
      updateData.family = null;
    }

    return this.repo.update(id, updateData);
  }

  public async getCategory(id: string) {
    return this.repo.findById(id);
  }

  public async getCategories(filter: CategoryQueryParams = {}) {
    let familyId = filter.family;
    if (!familyId && filter.familySlug) {
      const fam = await FamilyModel.findOne({ slug: filter.familySlug, isDeleted: false });
      if (fam) familyId = fam._id.toString();
    }

    const result = await this.repo.findAll({ ...filter, family: familyId });
    const categoryIds = result.categories.map((c: any) => c._id);

    const productsPerCat = await ProductModel.aggregate([
      { $match: { category: { $in: categoryIds }, isDeleted: false } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const productMap = new Map<string, number>();
    productsPerCat.forEach(item => {
      if (item._id) productMap.set(item._id.toString(), item.count);
    });

    const enriched = result.categories.map((cat: any) => ({
      ...cat,
      productsCount: productMap.get(cat._id.toString()) || 0,
    }));

    if (filter.sort === 'products_desc') {
      enriched.sort((a: any, b: any) => b.productsCount - a.productsCount);
    }

    return {
      categories: enriched,
      pagination: result.pagination,
    };
  }

  public async getCategoryLinkedItems(id: string) {
    const products = await ProductModel.find({ category: id, isDeleted: false })
      .select('name status family createdAt')
      .populate('family', 'name slug')
      .lean();

    return {
      products,
    };
  }

  public async changeStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    return this.repo.updateStatus(id, status);
  }

  public async deleteCategory(id: string) {
    return this.repo.softDelete(id);
  }
}

