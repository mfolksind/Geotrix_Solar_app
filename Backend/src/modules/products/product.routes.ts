import { Router } from 'express';
import validate from '../../middlewares/validate.middleware';
import { authenticate, authorize } from '../../modules/auth/auth.middleware';
import { createProductSchema, updateProductSchema, createVariantSchema, updateVariantSchema, uploadImagesSchema, listProductsSchema } from './product.validation';
import { ProductRepository } from './product.repository';
import { ProductVariantRepository } from './productVariant.repository';
import { ProductImageRepository } from './productImage.repository';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';

const router = Router();
const repo = new ProductRepository();
const variantRepo = new ProductVariantRepository();
const imageRepo = new ProductImageRepository();
const service = new ProductService(repo, variantRepo, imageRepo);
const controller = new ProductController(service);

router.post('/', authenticate, authorize('SUPER_ADMIN','ADMIN'), validate(createProductSchema), controller.createProduct);
router.get('/', validate(listProductsSchema, 'query'), controller.listProducts);
router.get('/:id', controller.getProduct);
router.get('/:id/related', controller.getRelatedProducts);
router.get('/:productId/variants', controller.getProductVariants);
router.patch('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), validate(updateProductSchema), controller.updateProduct);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.deleteProduct);

router.post('/:productId/variants', authenticate, authorize('SUPER_ADMIN','ADMIN'), validate(createVariantSchema), controller.createVariant);
router.patch('/variants/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), validate(updateVariantSchema), controller.updateVariant);
router.delete('/variants/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.deleteVariant);

router.post('/variants/:id/images', authenticate, authorize('SUPER_ADMIN','ADMIN'), validate(uploadImagesSchema), controller.uploadImages);
router.delete('/images/:id', authenticate, authorize('SUPER_ADMIN','ADMIN'), controller.deleteImage);

export default router;
