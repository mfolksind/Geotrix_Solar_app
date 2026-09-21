import { Router } from 'express';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import controller from './adminPayment.controller';

const router = Router();

router.get('/stats', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'manager'), controller.getStats);
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'manager'), controller.list);
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'manager'), controller.get);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.updateStatus);

export default router;
