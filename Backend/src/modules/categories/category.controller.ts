import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { CategoryService } from './category.service';
import { CreateCategoryPayload, UpdateCategoryPayload } from './category.types';

type AuthRequest = Request & { user?: { id: string } };

export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  public createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payload = req.body as CreateCategoryPayload;
    payload.createdBy = payload.createdBy ?? req.user?.id;
    const category = await this.service.createCategory(payload);
    res.status(201).json({ success: true, data: category });
  });

  public getCategories = asyncHandler(async (req: Request, res: Response) => {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const categories = await this.service.getCategories({ status });
    res.status(200).json({ success: true, data: categories });
  });

  public getCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const category = await this.service.getCategory(id);
    res.status(200).json({ success: true, data: category });
  });

  public updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const payload = req.body as UpdateCategoryPayload;
    payload.updatedBy = payload.updatedBy ?? req.user?.id;
    const category = await this.service.updateCategory(id, payload);
    res.status(200).json({ success: true, data: category });
  });

  public changeStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body as { status: 'ACTIVE' | 'INACTIVE' };
    const category = await this.service.changeStatus(id, status);
    res.status(200).json({ success: true, data: category });
  });

  public deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await this.service.deleteCategory(id);
    res.status(200).json({ success: true, data: deleted });
  });
}
