import { Request, Response } from 'express';
import asyncHandler from '../../../common/utils/asyncHandler';
import { TicketService } from '../services/ticket.service';

type AuthRequest = Request & { user?: { id: string; role?: string } };

export class TicketController {
  constructor(private readonly service: TicketService) {}

  public createTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const { subject, category, priority, message } = req.body as { subject: string; category?: string; priority?: string; message: string };
    const ticket = await this.service.createTicket(userId, { subject, category, priority, message });
    res.status(201).json({ success: true, data: ticket });
  });

  public getTickets = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id ?? null;
    const isAdmin = req.user?.role === 'admin';
    const { page, limit, ticketNumber, status, priority, search } = req.query as any;
    const result = await this.service.getTickets({ page: Number(page), limit: Number(limit), ticketNumber, status, priority, search }, userId, isAdmin);
    res.status(200).json({ success: true, data: result.items, meta: result.meta });
  });

  public getTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const userId = req.user?.id ?? null;
    const isAdmin = req.user?.role === 'admin';
    const ticket = await this.service.getTicket(id, userId, isAdmin);
    res.status(200).json({ success: true, data: ticket });
  });

  public updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: string };
    const userId = req.user!.id;
    const updated = await this.service.updateStatus(id, status, userId);
    res.status(200).json({ success: true, data: updated });
  });

  public assignTicket = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const { agentId } = req.body as { agentId: string };
    const userId = req.user!.id;
    const updated = await this.service.assignTicket(id, agentId, userId);
    res.status(200).json({ success: true, data: updated });
  });
}
