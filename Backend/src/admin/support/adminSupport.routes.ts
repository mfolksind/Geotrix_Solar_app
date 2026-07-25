import { Router } from 'express';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import controller from './adminSupport.controller';

const router = Router();

router.get('/', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), controller.list);
router.get('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), controller.get);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.updateStatus);
router.post('/:id/reply', authenticate, authorize('SUPER_ADMIN','ADMIN','MANAGER'), controller.reply);
router.patch('/:id/assign', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.assign);

export default router;
