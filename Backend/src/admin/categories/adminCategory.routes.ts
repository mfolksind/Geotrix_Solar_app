import { Router } from 'express';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import validate from '../../middlewares/validate.middleware';
import controller from './adminCategory.controller';
import { createCategorySchema, updateCategorySchema } from '../../modules/categories/category.validation';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.getAll);
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN'), validate(createCategorySchema), controller.create);
router.patch('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), validate(updateCategorySchema), controller.update);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.delete);

export default router;
