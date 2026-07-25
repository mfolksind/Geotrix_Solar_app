import { Router } from 'express';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoryRepository } from './category.repository';
import validate from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../auth/auth.middleware';
import { createCategorySchema, updateCategorySchema, changeStatusSchema } from './category.validation';

const router = Router();
const repo = new CategoryRepository();
const service = new CategoryService(repo);
const controller = new CategoryController(service);

router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(createCategorySchema), controller.createCategory);
router.get('/', controller.getCategories);
router.get('/:id', controller.getCategory);
router.patch('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(updateCategorySchema), controller.updateCategory);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(changeStatusSchema), controller.changeStatus);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.deleteCategory);

export default router;
