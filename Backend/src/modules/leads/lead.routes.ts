import { Router } from 'express';
import validate from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import { createLeadSchema, listLeadsSchema, updateLeadSchema } from './lead.validation';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';

const router = Router();
const service = new LeadService();
const controller = new LeadController(service);

// Public route to submit a lead (e.g. from the frontend contact form)
router.post('/', validate(createLeadSchema), controller.createLead);

// Protected admin routes
router.get('/stats', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.getStats);
router.get('/', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.getLeads);
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.getLeadById);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), validate(updateLeadSchema), controller.updateLeadStatus);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN', 'ADMIN'), controller.deleteLead);

export default router;

