import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AdminCategoryService } from './adminCategory.service';

const service = new AdminCategoryService();

export class AdminCategoryController {
  public getAll = asyncHandler(async (_req: Request, res: Response) => {
    const categories = await service.getAll();
    res.status(200).json({ success: true, data: categories });
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
}

export default new AdminCategoryController();
