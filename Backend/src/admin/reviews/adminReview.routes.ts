import { Router } from 'express';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import controller from './adminReview.controller';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.list);
router.patch('/:id/approve', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.approve);
router.patch('/:id/reject', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.approve);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.delete);

export default router;
