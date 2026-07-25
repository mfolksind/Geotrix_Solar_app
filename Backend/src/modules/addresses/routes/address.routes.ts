import { Router } from 'express';
import validate from '../../../middlewares/validate.middleware';
import { authenticate } from '../../auth/auth.middleware';
import { createAddressSchema, updateAddressSchema, idParamSchema } from '../validations/address.validation';
import { AddressRepository } from '../repositories/address.repository';
import { AddressService } from '../services/address.service';
import { AddressController } from '../controllers/address.controller';

const router = Router();
const repo = new AddressRepository();
const service = new AddressService(repo);
const controller = new AddressController(service);

router.post('/', authenticate, validate(createAddressSchema), controller.createAddress);
router.get('/', authenticate, controller.getAddresses);
router.get('/:id', authenticate, validate(idParamSchema, 'params'), controller.getAddress);
router.patch('/:id', authenticate, validate(idParamSchema, 'params'), validate(updateAddressSchema), controller.updateAddress);
router.patch('/:id/default', authenticate, validate(idParamSchema, 'params'), controller.setDefault);
router.delete('/:id', authenticate, validate(idParamSchema, 'params'), controller.deleteAddress);

export default router;
