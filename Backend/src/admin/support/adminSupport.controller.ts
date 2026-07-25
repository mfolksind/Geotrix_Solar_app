import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { AdminSupportService } from './adminSupport.service';

const service = new AdminSupportService();

export class AdminSupportController {
  public list = asyncHandler(async (req: Request, res: Response) => {
    const result = await service.list(req.query as Record<string, unknown>);
    res.status(200).json({ success: true, data: result });
  });

  public get = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const ticket = await service.get(id);
    res.status(200).json({ success: true, data: ticket });
  });

  public updateStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const updated = await service.updateStatus(id, status);
    res.status(200).json({ success: true, data: updated });
  });

  public reply = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const payload = req.body;
    const userId = (req as any).user?.id as string;
    const msg = await service.reply(id, payload, userId);
    res.status(201).json({ success: true, data: msg });
  });

  public assign = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const { agentId } = req.body as { agentId: string };
    const assigned = await service.assign(id, agentId);
    res.status(200).json({ success: true, data: assigned });
  });
}

export default new AdminSupportController();
