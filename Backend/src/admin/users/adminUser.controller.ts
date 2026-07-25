import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AdminUserService } from './adminUser.service';

type AuthRequest = Request & { user?: { id: string; role?: string } };

const service = new AdminUserService();

export class AdminUserController {
  public create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payload = req.body;
    const created = await service.createAdmin(payload);
    res.status(201).json({ success: true, data: created });
  });

  public updateRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { role } = req.body as { role: string };
    const updated = await service.updateRole(id, role);
    res.status(200).json({ success: true, data: updated });
  });

  public delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const deleted = await service.deleteAdmin(id);
    res.status(200).json({ success: true, data: deleted });
  });

  public list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await service.listUsers(req.query as Record<string, unknown>);
    res.status(200).json({ success: true, data: result });
  });

  public get = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const user = await service.getUser(id);
    res.status(200).json({ success: true, data: user });
  });

  public changeStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const payload = req.body;
    const updated = await service.changeStatus(id, payload);
    res.status(200).json({ success: true, data: updated });
  });
}

export default new AdminUserController();
