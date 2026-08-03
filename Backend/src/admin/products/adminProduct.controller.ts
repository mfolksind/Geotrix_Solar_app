import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AdminProductService } from './adminProduct.service';

const service = new AdminProductService();

export class AdminProductController {
  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as any;
    const products = await service.getAll(query);
    res.status(200).json({ success: true, data: products });
  });

  public create = asyncHandler(async (req: Request, res: Response) => {
    const created = await service.create(req.body);
    res.status(201).json({ success: true, data: created });
  });

  public update = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const updated = await service.update(id, req.body);
    res.status(200).json({ success: true, data: updated });
  });

  public delete = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const deleted = await service.delete(id);
    res.status(200).json({ success: true, data: deleted });
  });

  public changeStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const updated = await service.changeStatus(id, status);
    res.status(200).json({ success: true, data: updated });
  });

  public uploadImage = asyncHandler(async (req: Request, res: Response) => {
    const payload = req.body;
    const uploaded = await service.uploadImage(payload);
    res.status(201).json({ success: true, data: uploaded });
  });

  public deleteImage = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const deleted = await service.deleteImage(id);
    res.status(200).json({ success: true, data: deleted });
  });

  public getVariants = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const variants = await service.getVariants(id);
    res.status(200).json({ success: true, data: variants });
  });

  public createVariant = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const created = await service.createVariant(id, req.body);
    res.status(201).json({ success: true, data: created });
  });

  public updateVariant = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const updated = await service.updateVariant(id, req.body);
    res.status(200).json({ success: true, data: updated });
  });

  public deleteVariant = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const deleted = await service.deleteVariant(id);
    res.status(200).json({ success: true, data: deleted });
  });
}

export default new AdminProductController();
