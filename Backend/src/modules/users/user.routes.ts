import { Router } from 'express';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { userIdParamSchema, updateProfileSchema, changeStatusSchema } from './user.validation';
import validate from '../../middlewares/validate.middleware';
import { authenticate } from '../auth/auth.middleware';

const router = Router();
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const userController = new UserController(userService);

router.get('/me', authenticate, userController.getProfile);
router.put('/me', authenticate, validate(updateProfileSchema), userController.updateProfile);
router.get('/customers', authenticate, userController.getCustomers);
router.get('/admins', authenticate, userController.getAdmins);
router.get('/:id', validate(userIdParamSchema, 'params'), userController.getUserById);
router.patch('/:id/status', validate(userIdParamSchema, 'params'), validate(changeStatusSchema), userController.changeUserStatus);
router.delete('/:id', validate(userIdParamSchema, 'params'), userController.deleteUser);

export default router;
