import { Router } from 'express';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import controller from './adminUser.controller';

const router = Router();

router.get('/stats', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'manager'), controller.getStats);
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'manager'), controller.list);
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'manager'), controller.get);
router.get('/:id/details', authenticate, authorize('SUPER_ADMIN', 'ADMIN', 'manager'), controller.get);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.create);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.update);
router.patch('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.update);
router.patch('/:id/role', authenticate, authorize('SUPER_ADMIN'), controller.updateRole);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.changeStatus);
router.patch('/:id/family-approval', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.approveFamily);
router.patch('/:id/family', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.changeFamily);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.delete);

export default router;
