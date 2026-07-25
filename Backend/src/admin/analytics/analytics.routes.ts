import { Router } from 'express';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import controller from './analytics.controller';

const router = Router();

router.get('/sales', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.sales);
router.get('/orders', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.orders);
router.get('/products', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.products);
router.get('/users', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.users);
router.get('/revenue', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.revenue);

export default router;
