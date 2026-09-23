import { TicketRepository } from '../repositories/ticket.repository';
import { TicketMessageRepository } from '../repositories/ticketMessage.repository';
import { ApiError } from '../../../common/errors/ApiError';
import TicketModel from '../models/ticket.model';
import { ITicketDocument } from '../interfaces/support.interface';
import { Attachment } from '../types/support.types';
import { emitToAdmins, emitToTicket, emitToUser } from '../../../socket/socket.server';
import { notificationService } from '../../notifications/notification.service';

function generateTicketNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `TKT-${y}${m}${d}-${rand}`;
}

export class TicketService {
  constructor(private readonly repo: TicketRepository, private readonly messageRepo: TicketMessageRepository) {}

  public async createTicket(userId: string, payload: { subject: string; category?: string; priority?: string; message: string; attachments?: Attachment[] }) {
    const ticketNumber = generateTicketNumber();

    const ticket = await this.repo.create({
      ticketNumber,
      user: userId as any,
      subject: payload.subject,
      category: payload.category || 'GENERAL',
      priority: (payload.priority as any) || 'LOW',
      status: 'OPEN',
      createdBy: userId as any,
      updatedBy: userId as any,
      lastMessageAt: new Date(),
    } as Partial<ITicketDocument>);

    // create initial message
    const initialMsg = await this.messageRepo.create({
      ticket: ticket._id,
      sender: userId,
      message: payload.message,
      attachments: payload.attachments || [],
      isInternalNote: false,
    } as any);

    // Real-time socket emission to admins
    emitToAdmins('ticket:created', {
      ticket,
      initialMessage: initialMsg,
    });

    // Notify administrators / staff
    try {
      await notificationService.sendToRole('admin', {
        title: `New Support Ticket #${ticketNumber}`,
        message: `${payload.subject} (${payload.category || 'GENERAL'})`,
        type: 'TICKET_CREATED',
        data: {
          ticketId: String(ticket._id),
          ticketNumber,
          category: ticket.category,
          priority: ticket.priority,
        },
      });
    } catch (err) {
      console.warn('[TicketService] Failed to dispatch admin notification:', err);
    }

    return ticket;
  }

  public async getTicket(id: string, userId: string | null, isAdmin = false) {
    const ticket = await this.repo.findById(id);
    if (!ticket || ticket.isDeleted) throw new ApiError(404, 'Ticket not found');
    if (!isAdmin && ticket.user.toString() !== userId) throw new ApiError(403, 'Forbidden');
    const populated = await TicketModel.findById(id).populate('user', 'name email profilePicture').populate('assignedTo', 'name email').exec();
    const messages = await this.messageRepo.findByTicket(id);
    return {
      ticket: populated,
      messages,
    };
  }

  public async getTickets(query: { page?: number; limit?: number; ticketNumber?: string; status?: string; priority?: string; search?: string }, userId: string | null, isAdmin = false) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? Math.min(query.limit, 100) : 20;
    const skip = (page - 1) * limit;

    const filter: any = { isDeleted: false };
    if (!isAdmin && userId) filter.user = userId;
    if (query.ticketNumber) filter.ticketNumber = query.ticketNumber;
    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.search) filter.subject = { $regex: query.search, $options: 'i' };

    const items = await this.repo.findAll(filter, skip, limit);
    const total = await TicketModel.countDocuments(filter).exec();
    return { items, meta: { page, limit, total } };
  }

  public async updateStatus(id: string, status: string, userId: string) {
    const ticket = await this.repo.findById(id);
    if (!ticket || ticket.isDeleted) throw new ApiError(404, 'Ticket not found');
    const updated = await this.repo.updateStatus(id, status, { updatedBy: userId });

    // Emit live socket updates
    emitToTicket(id, 'ticket:status_changed', { ticketId: id, status, updatedBy: userId });
    emitToUser(String(ticket.user), 'ticket:updated', { ticketId: id, status });

    // Notify customer if status was updated by staff
    if (String(ticket.user) !== userId) {
      try {
        await notificationService.sendNotification({
          recipient: String(ticket.user),
          sender: userId,
          title: `Ticket #${ticket.ticketNumber} Status: ${status}`,
          message: `Your support ticket status has been updated to "${status}".`,
          type: 'TICKET_STATUS',
          data: { ticketId: id, ticketNumber: ticket.ticketNumber, status },
        });
      } catch (err) {
        console.warn('[TicketService] Failed to notify user on status change:', err);
      }
    }

    return updated;
  }

  public async assignTicket(id: string, agentId: string, userId: string) {
    const ticket = await this.repo.findById(id);
    if (!ticket || ticket.isDeleted) throw new ApiError(404, 'Ticket not found');
    const updated = await this.repo.assignAgent(id, agentId);
    await this.repo.updateStatus(id, ticket.status, { updatedBy: userId });

    // Emit live socket updates
    emitToTicket(id, 'ticket:assigned', { ticketId: id, agentId, updatedBy: userId });

    // Notify newly assigned agent
    if (agentId && agentId !== userId) {
      try {
        await notificationService.sendNotification({
          recipient: agentId,
          sender: userId,
          title: `Assigned to Ticket #${ticket.ticketNumber}`,
          message: `You have been assigned to handle support ticket: "${ticket.subject}"`,
          type: 'TICKET_STATUS',
          data: { ticketId: id, ticketNumber: ticket.ticketNumber },
        });
      } catch (err) {
        console.warn('[TicketService] Failed to notify assigned agent:', err);
      }
    }

    return updated;
  }
}
