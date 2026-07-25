import { Router } from 'express';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import controller from './adminOrder.controller';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), controller.list);
router.get('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), controller.get);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), controller.updateStatus);
router.patch('/:id/payment-status', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.updatePaymentStatus);
router.patch('/:id/shipping', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.updateShipping);
router.patch('/:id/cancel', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), controller.cancel);

export default router;
