import crypto from 'crypto';
import { CategoryRepository } from './category.repository';
import { CreateCategoryPayload, UpdateCategoryPayload } from './category.types';

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
      description: payload.description,
      image: payload.image,
      parentCategory: payload.parentCategory ? payload.parentCategory : null,
      sortOrder: payload.sortOrder ?? 0,
      createdBy: payload.createdBy,
    } as const;

    return this.repo.create(toCreate as any);
  }

  public async updateCategory(id: string, payload: UpdateCategoryPayload) {
    if (payload.name) {
      const other = await this.repo.findByName(payload.name);
      if (other && other.id !== id) throw new Error('Category name already exists');
    }

    if (payload.slug) {
      const slug = generateSlug(payload.slug);
      const other = await this.repo.findBySlug(slug);
      if (other && other.id !== id) throw new Error('Category slug already exists');
      payload.slug = slug;
    }

    return this.repo.update(id, payload as any);
  }

  public async getCategory(id: string) {
    return this.repo.findById(id);
  }

  public async getCategories(filter?: { status?: string }) {
    return this.repo.findAll({ status: filter?.status });
  }

  public async changeStatus(id: string, status: 'ACTIVE' | 'INACTIVE') {
    return this.repo.updateStatus(id, status);
  }

  public async deleteCategory(id: string) {
    return this.repo.softDelete(id);
  }
}
