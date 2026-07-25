import { Router } from 'express';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import controller from './adminGeotrixBill.controller';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.list);
router.get('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.get);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.updateStatus);
router.patch('/:id/approve', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.approve);
router.patch('/:id/reject', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.reject);

export default router;
