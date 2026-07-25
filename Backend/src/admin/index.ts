import { Router } from 'express';
import dashboardRoutes from './dashboard/dashboard.routes';
import adminUserRoutes from './users/adminUser.routes';
import adminCategoryRoutes from './categories/adminCategory.routes';
import adminProductRoutes from './products/adminProduct.routes';
import adminOrderRoutes from './orders/adminOrder.routes';
import adminReviewRoutes from './reviews/adminReview.routes';
import adminSupportRoutes from './support/adminSupport.routes';
import adminGeotrixBillRoutes from './geotrixBills/adminGeotrixBill.routes';
import analyticsRoutes from './analytics/analytics.routes';

const router = Router();

router.use('/dashboard', dashboardRoutes);
router.use('/users', adminUserRoutes);
router.use('/categories', adminCategoryRoutes);
router.use('/products', adminProductRoutes);
router.use('/orders', adminOrderRoutes);
router.use('/reviews', adminReviewRoutes);
router.use('/support', adminSupportRoutes);
router.use('/geotrix-bills', adminGeotrixBillRoutes);
router.use('/analytics', analyticsRoutes);

export default router;

