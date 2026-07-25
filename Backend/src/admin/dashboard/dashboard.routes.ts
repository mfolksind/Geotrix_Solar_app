import { Router } from 'express';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import controller from './dashboard.controller';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), controller.get);

export default router;
