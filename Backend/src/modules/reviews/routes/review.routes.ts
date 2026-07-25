import { Router } from 'express';
import validate from '../../../middlewares/validate.middleware';
import { createReviewSchema, updateReviewSchema, idParamSchema, productIdParamSchema, querySchema } from '../validations/review.validation';
import { ReviewRepository } from '../repositories/review.repository';
import { ReviewService } from '../services/review.service';
import { ReviewController } from '../controllers/review.controller';

const router = Router();
const repo = new ReviewRepository();
const service = new ReviewService(repo);
const controller = new ReviewController(service);

router.post('/', validate(createReviewSchema), controller.createReview);
router.get('/product/:productId', validate(productIdParamSchema, 'params'), validate(querySchema, 'query'), controller.getProductReviews);
router.get('/:id', validate(idParamSchema, 'params'), controller.getReview);
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateReviewSchema), controller.updateReview);
router.patch('/:id/approve', validate(idParamSchema, 'params'), controller.approveReview);
router.delete('/:id', validate(idParamSchema, 'params'), controller.deleteReview);

export default router;
