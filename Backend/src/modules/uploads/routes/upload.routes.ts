import { Router } from 'express';
import asyncHandler from '../../../common/utils/asyncHandler';
import { uploadSingleToPublic } from '../../../common/middleware/multer.middleware';
import { uploadImage } from '../../../common/services/cloudinary/cloudinary.service';

const router = Router();

router.post(
  '/',
  uploadSingleToPublic('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const result = await uploadImage(req.file, 'uploads');

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        fileName: req.file.filename,
        url: result.secure_url || `/uploads/${req.file.filename}`,
        publicId: result.public_id,
      },
    });
  })
);

export default router;
