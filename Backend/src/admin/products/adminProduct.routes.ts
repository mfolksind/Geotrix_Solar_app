import { Router } from 'express';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import controller from './adminProduct.controller';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.getAll);
router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.create);
router.patch('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.update);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.delete);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.changeStatus);
router.post('/:id/images', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.uploadImage);
router.delete('/images/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.deleteImage);
router.post('/:id/variants', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.createVariant);
router.patch('/variants/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.updateVariant);
router.delete('/variants/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.deleteVariant);

export default router;
