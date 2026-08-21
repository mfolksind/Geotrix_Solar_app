import { Router } from 'express';
import { FamilyController } from './family.controller';
// import { protect, authorize } from '../../common/middleware/auth'; // Adjust based on your auth middleware

const router = Router();
const familyController = new FamilyController();

router.post('/', familyController.createFamily);
router.get('/', familyController.getAllFamilies);
router.get('/:id', familyController.getFamilyById);
router.patch('/:id', familyController.updateFamily);
router.delete('/:id', familyController.deleteFamily);

export default router;
