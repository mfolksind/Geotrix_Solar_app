import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { ProductService } from './product.service';
import { CreateProductPayload, UpdateProductPayload, CreateVariantPayload, UpdateVariantPayload, UploadImagePayload } from './product.types';

type AuthRequest = Request & { user?: { id: string } };

export class ProductController {
  constructor(private readonly service: ProductService) {}

  public createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payload = req.body as CreateProductPayload;
    payload.createdBy = payload.createdBy ?? req.user?.id;
    const product = await this.service.createProduct(payload);
    res.status(201).json({ success: true, data: product });
  });

  public listProducts = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as any;
    const products = await this.service.listProducts(query);
    res.status(200).json({ success: true, data: products });
  });

  public getProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = await this.service.getProduct(id);
    res.status(200).json({ success: true, data: product });
  });

  public updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const payload = req.body as UpdateProductPayload;
    payload.updatedBy = payload.updatedBy ?? req.user?.id;
    const product = await this.service.updateProduct(id, payload);
    res.status(200).json({ success: true, data: product });
  });

  public deleteProduct = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await this.service.deleteProduct(id);
    res.status(200).json({ success: true, data: deleted });
  });

  public createVariant = asyncHandler(async (req: Request, res: Response) => {
    const { productId } = req.params;
    const payload = req.body as CreateVariantPayload;
    const variant = await this.service.createVariant(productId, payload);
    res.status(201).json({ success: true, data: variant });
  });

  public updateVariant = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body as UpdateVariantPayload;
    const variant = await this.service.updateVariant(id, payload);
    res.status(200).json({ success: true, data: variant });
  });

  public deleteVariant = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await this.service.deleteVariant(id);
    res.status(200).json({ success: true, data: deleted });
  });

  public uploadImages = asyncHandler(async (req: Request, res: Response) => {
    const { id: variantId } = req.params;
    const payload = req.body as UploadImagePayload;
    payload.variantId = variantId;
    const image = await this.service.uploadImage(payload);
    res.status(201).json({ success: true, data: image });
  });

  public deleteImage = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await this.service.deleteImage(id);
    res.status(200).json({ success: true, data: deleted });
  });
}
