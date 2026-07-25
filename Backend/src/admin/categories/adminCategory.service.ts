import { CategoryRepository } from '../../modules/categories/category.repository';
import { CategoryService } from '../../modules/categories/category.service';

export class AdminCategoryService {
  private repo = new CategoryRepository();
  private service = new CategoryService(this.repo);

  public async getAll() {
    return this.service.getCategories();
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
