import mongoose from 'mongoose';
import { TicketRepository } from '../repositories/ticket.repository';
import { TicketMessageRepository } from '../repositories/ticketMessage.repository';
import { ApiError } from '../../../common/errors/ApiError';
import TicketModel from '../models/ticket.model';
import TicketMessageModel from '../models/ticketMessage.model';
import { ITicketDocument } from '../interfaces/support.interface';
import { Attachment } from '../types/support.types';

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
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const ticket = await this.repo.create({
        ticketNumber,
        user: userId,
        subject: payload.subject,
        category: payload.category,
        priority: (payload.priority as any) || 'LOW',
        status: 'OPEN',
        createdBy: userId,
        updatedBy: userId,
        lastMessageAt: new Date(),
      } as Partial<ITicketDocument>, session);

      // create initial message
      await this.messageRepo.create({ ticket: ticket._id, sender: userId, message: payload.message, attachments: payload.attachments || [] } as any, session);

      await session.commitTransaction();
      session.endSession();
      return ticket;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw ApiError.fromUnknown(err);
    }
  }

  public async getTicket(id: string, userId: string | null, isAdmin = false) {
    const ticket = await this.repo.findById(id);
    if (!ticket || ticket.isDeleted) throw new ApiError(404, 'Ticket not found');
    if (!isAdmin && ticket.user.toString() !== userId) throw new ApiError(403, 'Forbidden');
    return TicketModel.findById(id).populate('user', 'name email profilePicture').populate('assignedTo', 'name email').exec();
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
    return updated;
  }

  public async assignTicket(id: string, agentId: string, userId: string) {
    const ticket = await this.repo.findById(id);
    if (!ticket || ticket.isDeleted) throw new ApiError(404, 'Ticket not found');
    const updated = await this.repo.assignAgent(id, agentId);
    await this.repo.updateStatus(id, ticket.status, { updatedBy: userId });
    return updated;
  }
}
