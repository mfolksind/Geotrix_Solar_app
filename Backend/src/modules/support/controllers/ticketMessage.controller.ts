import { Request, Response } from 'express';
import asyncHandler from '../../../common/utils/asyncHandler';
import { TicketMessageService } from '../services/ticketMessage.service';

type AuthRequest = Request & { user?: { id: string; role?: string } };

export class TicketMessageController {
  constructor(private readonly service: TicketMessageService) {}

  public replyToTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const files = (req as any).files as Express.Multer.File[] | undefined;
    const { message, isInternalNote } = req.body as { message: string; isInternalNote?: boolean };
    const senderId = req.user!.id;
    const reply = await this.service.replyToTicket(id, senderId, { message, attachments: files ?? [], isInternalNote });
    res.status(201).json({ success: true, data: reply });
  });

  public getConversation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { page, limit } = req.query as any;
    const userId = req.user?.id ?? null;
    const isAdmin = req.user?.role === 'admin';
    const conv = await this.service.getConversation(id, userId, isAdmin, Number(page) || 1, Number(limit) || 100);
    res.status(200).json({ success: true, data: conv.items });
  });
}
