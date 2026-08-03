import { Router } from 'express';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import controller from './adminGeotrixBill.controller';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.list);
router.get('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.get);


export default router;
