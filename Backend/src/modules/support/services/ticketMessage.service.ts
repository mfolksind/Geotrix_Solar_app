import mongoose from 'mongoose';
import { TicketRepository } from '../repositories/ticket.repository';
import { TicketMessageRepository } from '../repositories/ticketMessage.repository';
import { ApiError } from '../../../common/errors/ApiError';
import { Attachment } from '../types/support.types';
import * as cloudinary from '../../../common/services/cloudinary/cloudinary.service';

export class TicketMessageService {
  constructor(private readonly repo: TicketMessageRepository, private readonly ticketRepo: TicketRepository) {}

  public async replyToTicket(ticketId: string, senderId: string, payload: { message: string; attachments?: Express.Multer.File[]; isInternalNote?: boolean }) {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket || ticket.isDeleted) throw new ApiError(404, 'Ticket not found');
    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') throw new ApiError(400, 'Cannot reply to a closed/resolved ticket');

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      let attachments: Attachment[] = [];
      if (payload.attachments && payload.attachments.length > 0) {
        const uploaded = await cloudinary.uploadMultipleImages(payload.attachments, `support/${ticket.ticketNumber}`);
        attachments = uploaded.map((u) => ({ url: u.secure_url, publicId: u.public_id, fileName: `${u.public_id}` }));
      }

      const messageDoc = await this.repo.create({ ticket: ticketId, sender: senderId, message: payload.message, attachments, isInternalNote: payload.isInternalNote ?? false } as any, session);

      // update ticket lastMessageAt
      await this.ticketRepo.updateStatus(ticketId, ticket.status, { lastMessageAt: new Date(), updatedBy: senderId }, session);

      await session.commitTransaction();
      session.endSession();
      return messageDoc;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw ApiError.fromUnknown(err);
    }
  }

  public async getConversation(ticketId: string, userId: string | null, isAdmin = false, page = 1, limit = 100) {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket || ticket.isDeleted) throw new ApiError(404, 'Ticket not found');
    if (!isAdmin && ticket.user.toString() !== userId) throw new ApiError(403, 'Forbidden');
    const skip = (page - 1) * limit;
    const items = await this.repo.findByTicket(ticketId, skip, limit);
    return { items };
  }
}
