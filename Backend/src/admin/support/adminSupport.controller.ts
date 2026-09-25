import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AdminSupportService } from './adminSupport.service';

type AuthRequest = Request & { user?: { id: string; role?: string } };

const service = new AdminSupportService();

export class AdminSupportController {
  public getStats = asyncHandler(async (_req: AuthRequest, res: Response) => {
    const stats = await service.getStats();
    res.status(200).json({ success: true, data: stats });
  });

  public list = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await service.list(req.query as Record<string, unknown>);
    res.status(200).json({ success: true, data: result });
  });

  public get = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const details = await service.getTicketDetails(id);
    res.status(200).json({ success: true, data: details });
  });

  public updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const userId = req.user?.id as string;
    const updated = await service.updateStatus(id, status, userId);
    res.status(200).json({ success: true, data: updated });
  });

  public updatePriority = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { priority } = req.body as { priority: string };
    const userId = req.user?.id as string;
    const updated = await service.updatePriority(id, priority, userId);
    res.status(200).json({ success: true, data: updated });
  });

  public reply = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const payload = req.body;
    const userId = req.user?.id as string;
    const msg = await service.reply(id, payload, userId);
    res.status(201).json({ success: true, data: msg });
  });

  public assign = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { agentId } = req.body as { agentId: string };
    const userId = req.user?.id as string;
    const assigned = await service.assign(id, agentId, userId);
    res.status(200).json({ success: true, data: assigned });
  });

  public delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const deleted = await service.delete(id);
    res.status(200).json({ success: true, data: deleted });
  });
}

export default new AdminSupportController();
