import { Router } from 'express';
import validate from '../../../middlewares/validate.middleware';
import { createPaymentSchema, verifyPaymentSchema, refundRequestSchema, idParamSchema } from '../validations/payment.validation';
import { PaymentRepository } from '../repositories/payment.repository';
import { OrderRepository } from '../../orders/repositories/order.repository';
import { PaymentService } from '../services/payment.service';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
const repo = new PaymentRepository();
const orderRepo = new OrderRepository();
const service = new PaymentService(repo, orderRepo);
const controller = new PaymentController(service);

router.post('/create', validate(createPaymentSchema), controller.createPayment);
router.post('/verify', validate(verifyPaymentSchema), controller.verifyPayment);
router.post('/:id/retry', validate(idParamSchema, 'params'), controller.retryPayment);
router.post('/:id/refund', validate(idParamSchema, 'params'), validate(refundRequestSchema), controller.refundPayment);
router.get('/:id', validate(idParamSchema, 'params'), controller.getPayment);
router.get('/user', controller.getPaymentsByUser);

export default router;
