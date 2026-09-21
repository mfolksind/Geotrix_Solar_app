import { Router } from 'express';
import { FamilyController } from './family.controller';
import { authenticate, authorize } from '../auth/auth.middleware';

const router = Router();
const familyController = new FamilyController();

router.get('/stats', familyController.getStats);
router.get('/', familyController.getAllFamilies);
router.get('/:id/linked', familyController.getLinkedItems);
router.get('/:id', familyController.getFamilyById);
router.post('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), familyController.createFamily);
router.patch('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), familyController.updateFamily);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), familyController.deleteFamily);

export default router;

