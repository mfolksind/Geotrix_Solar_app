import { Router } from 'express';
import validate from '../../../middlewares/validate.middleware';
import { authenticate } from '../../auth/auth.middleware';
import { createOrderSchema, updateStatusSchema, idParamSchema } from '../validations/order.validation';
import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/orderItem.repository';
import { CartRepository } from '../../carts/repositories/cart.repository';
import { CartItemRepository } from '../../carts/repositories/cartItem.repository';
import { OrderService } from '../services/order.service';
import { OrderController } from '../controllers/order.controller';

const router = Router();
const orderRepo = new OrderRepository();
const orderItemRepo = new OrderItemRepository();
const cartRepo = new CartRepository();
const cartItemRepo = new CartItemRepository();
const service = new OrderService(orderRepo, orderItemRepo, cartRepo, cartItemRepo);
const controller = new OrderController(service);

router.post('/', authenticate, validate(createOrderSchema), controller.createOrder);
router.get('/', authenticate, controller.getOrders);
router.get('/:id', authenticate, validate(idParamSchema, 'params'), controller.getOrder);
router.patch('/:id/status', authenticate, validate(idParamSchema, 'params'), validate(updateStatusSchema), controller.updateStatus);
router.patch('/:id/cancel', authenticate, validate(idParamSchema, 'params'), controller.cancelOrder);

export default router;
