import { Router } from 'express';
import validate from '../../../middlewares/validate.middleware';
import { authenticate } from '../../auth/auth.middleware';
import { addItemSchema, updateItemSchema, idParamSchema } from '../validations/cart.validation';
import { CartRepository } from '../repositories/cart.repository';
import { CartItemRepository } from '../repositories/cartItem.repository';
import { CartService } from '../services/cart.service';
import { CartController } from '../controllers/cart.controller';

const router = Router();
const cartRepo = new CartRepository();
const itemRepo = new CartItemRepository();
const service = new CartService(cartRepo, itemRepo);
const controller = new CartController(service);

router.post('/items', authenticate, validate(addItemSchema), controller.addItem);
router.get('/', authenticate, controller.getCart);
router.patch('/items/:itemId', authenticate, validate(updateItemSchema), controller.updateItem);
router.delete('/items/:itemId', authenticate, controller.removeItem);
router.delete('/', authenticate, controller.clearCart);

export default router;
