import { Router } from 'express';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import controller from './adminReview.controller';

const router = Router();

router.get('/stats', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'manager'), controller.getStats);
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'manager'), controller.list);
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'manager'), controller.get);
router.patch('/:id/approve', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.approve);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.delete);

export default router;
