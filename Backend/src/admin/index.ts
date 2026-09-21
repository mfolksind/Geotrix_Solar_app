import { Router } from 'express';
import dashboardRoutes from './dashboard/dashboard.routes';
import adminUserRoutes from './users/adminUser.routes';
import adminCategoryRoutes from './categories/adminCategory.routes';
import adminProductRoutes from './products/adminProduct.routes';
import adminOrderRoutes from './orders/adminOrder.routes';
import adminReviewRoutes from './reviews/adminReview.routes';
import adminPaymentRoutes from './payments/adminPayment.routes';
import adminSupportRoutes from './support/adminSupport.routes';
import analyticsRoutes from './analytics/analytics.routes';
import { familyRoutes } from '../modules/families';
import { leadRoutes } from '../modules/leads';
import { addressRoutes } from '../modules/addresses';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/users', adminUserRoutes);
router.use('/addresses', addressRoutes);
router.use('/families', familyRoutes);
router.use('/categories', adminCategoryRoutes);
router.use('/products', adminProductRoutes);
router.use('/orders', adminOrderRoutes);
router.use('/payments', adminPaymentRoutes);
router.use('/leads', leadRoutes);
router.use('/reviews', adminReviewRoutes);
router.use('/support', adminSupportRoutes);
router.use('/tickets', adminSupportRoutes);
router.use('/analytics', analyticsRoutes);

export default router;



