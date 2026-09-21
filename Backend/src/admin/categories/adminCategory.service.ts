import { CategoryRepository } from '../../modules/categories/category.repository';
import { CategoryService } from '../../modules/categories/category.service';
import { CategoryQueryParams } from '../../modules/categories/category.types';

export class AdminCategoryService {
  private repo = new CategoryRepository();
  private service = new CategoryService(this.repo);

  public async getStats() {
    return this.service.getStats();
  }

  public async getAll(query: CategoryQueryParams = {}) {
    return this.service.getCategories(query);
  }

  public async getById(id: string) {
    return this.service.getCategory(id);
  }

  public async getLinked(id: string) {
    return this.service.getCategoryLinkedItems(id);
  }

  public async create(payload: any) {
    return this.service.createCategory(payload);
  }

  public async update(id: string, payload: any) {
    return this.service.updateCategory(id, payload);
  }

  public async delete(id: string) {
    return this.service.deleteCategory(id);
  }
}

