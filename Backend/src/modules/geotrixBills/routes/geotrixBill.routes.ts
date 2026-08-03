import { Router } from 'express';
import validate from '../../../middlewares/validate.middleware';
import { createBillSchema, listQuerySchema } from '../validations/geotrixBill.validation';
import { GeotrixBillRepository } from '../repositories/geotrixBill.repository';
import { GeotrixBillService } from '../services/geotrixBill.service';
import { GeotrixBillController } from '../controllers/geotrixBill.controller';

const router = Router();
const repo = new GeotrixBillRepository();
const service = new GeotrixBillService(repo);
const controller = new GeotrixBillController(service);

router.post('/', validate(createBillSchema), controller.create);
router.get('/', validate(listQuerySchema, 'query'), controller.list);

export default router;
