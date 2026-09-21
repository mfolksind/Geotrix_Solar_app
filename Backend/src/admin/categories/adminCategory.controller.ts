import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AdminCategoryService } from './adminCategory.service';

const service = new AdminCategoryService();

export class AdminCategoryController {
  public getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await service.getStats();
    res.status(200).json({ success: true, data: stats });
  });

  public getAll = asyncHandler(async (req: Request, res: Response) => {
    const result = await service.getAll(req.query);
    res.status(200).json({
      success: true,
      data: result.categories,
      pagination: result.pagination
    });
  });

  public getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const category = await service.getById(id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }
    res.status(200).json({ success: true, data: category });
  });

  public getLinked = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const linked = await service.getLinked(id);
    res.status(200).json({ success: true, data: linked });
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

