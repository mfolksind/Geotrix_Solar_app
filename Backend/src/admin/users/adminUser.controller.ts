import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AdminUserService } from './adminUser.service';

type AuthRequest = Request & { user?: { id: string; role?: string } };

const service = new AdminUserService();

export class AdminUserController {
  public getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await service.getStats();
    res.status(200).json({ success: true, data: stats });
  });

  public create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payload = req.body;
    const created = await service.createUser(payload);
    res.status(201).json({ success: true, data: created });
  });

  public update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const payload = req.body;
    const updated = await service.updateUser(id, payload);
    res.status(200).json({ success: true, data: updated });
  });

  public updateRole = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { role } = req.body as { role: string };
    const updated = await service.updateRole(id, role);
    res.status(200).json({ success: true, data: updated });
  });

  public delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const deleted = await service.deleteUser(id);
    res.status(200).json({ success: true, data: deleted });
  });

  public list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await service.listUsers(req.query as Record<string, unknown>);
    res.status(200).json({ success: true, data: result });
  });

  public get = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const userDetails = await service.getUserDetails(id);
    res.status(200).json({ success: true, data: userDetails });
  });

  public changeStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const payload = req.body;
    const updated = await service.changeStatus(id, payload);
    res.status(200).json({ success: true, data: updated });
  });

  public approveFamily = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const payload = req.body;
    const updated = await service.approveFamily(id, payload);
    res.status(200).json({ success: true, data: updated });
  });

  public changeFamily = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { family } = req.body as { family: string };
    const updated = await service.changeUserFamily(id, family);
    res.status(200).json({ success: true, data: updated });
  });
}

export default new AdminUserController();
