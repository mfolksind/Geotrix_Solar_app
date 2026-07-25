import { Router } from 'express';
import validate from '../../../middlewares/validate.middleware';
import { createBillSchema, updateBillSchema, idParamSchema, updateStatusSchema, listQuerySchema } from '../validations/geotrixBill.validation';
import { GeotrixBillRepository } from '../repositories/geotrixBill.repository';
import { GeotrixBillService } from '../services/geotrixBill.service';
import { GeotrixBillController } from '../controllers/geotrixBill.controller';

const router = Router();
const repo = new GeotrixBillRepository();
const service = new GeotrixBillService(repo);
const controller = new GeotrixBillController(service);

router.post('/', validate(createBillSchema), controller.create);
router.get('/', validate(listQuerySchema, 'query'), controller.list);
router.get('/:id', validate(idParamSchema, 'params'), controller.get);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateBillSchema), controller.update);
router.patch('/:id/status', validate(idParamSchema, 'params'), validate(updateStatusSchema), controller.updateStatus);
router.delete('/:id', validate(idParamSchema, 'params'), controller.delete);

export default router;
