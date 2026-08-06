import { Router } from 'express';
import validate from '../../../middlewares/validate.middleware';
import { authenticate } from '../../auth/auth.middleware';
import { z } from 'zod';

const idParamSchema = z.object({ id: z.string().trim().min(1) });
import { PaymentRepository } from '../repositories/payment.repository';
import { OrderRepository } from '../../orders/repositories/order.repository';
import { PaymentService } from '../services/payment.service';
import { PaymentController } from '../controllers/payment.controller';

const router = Router();
const repo = new PaymentRepository();
const orderRepo = new OrderRepository();
const service = new PaymentService(repo, orderRepo);
const controller = new PaymentController(service);

router.post('/razorpay/create-order', authenticate, controller.createRazorpayOrder);
router.post('/razorpay/verify', authenticate, controller.verifyRazorpayPayment);
router.get('/:id', authenticate, validate(idParamSchema, 'params'), controller.getPayment);
router.get('/user', authenticate, controller.getPaymentsByUser);

export default router;
