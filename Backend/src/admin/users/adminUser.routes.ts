import { Router } from 'express';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import controller from './adminUser.controller';

const router = Router();

router.post('/', authenticate, authorize('SUPER_ADMIN'), controller.create);
router.patch('/:id/role', authenticate, authorize('SUPER_ADMIN'), controller.updateRole);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), controller.delete);
router.get('/', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.list);
router.get('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.get);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.changeStatus);

export default router;
