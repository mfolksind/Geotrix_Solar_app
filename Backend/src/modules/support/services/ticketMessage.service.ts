import { TicketRepository } from '../repositories/ticket.repository';
import { TicketMessageRepository } from '../repositories/ticketMessage.repository';
import { ApiError } from '../../../common/errors/ApiError';
import { Attachment } from '../types/support.types';
import * as cloudinary from '../../../common/services/cloudinary/cloudinary.service';
import { emitToTicket, isUserInTicketRoom } from '../../../socket/socket.server';
import { notificationService } from '../../notifications/notification.service';
import UserModel from '../../users/user.model';

export class TicketMessageService {
  constructor(private readonly repo: TicketMessageRepository, private readonly ticketRepo: TicketRepository) {}

  public async replyToTicket(ticketId: string, senderId: string, payload: { message: string; attachments?: Express.Multer.File[]; isInternalNote?: boolean }) {
    const ticket = await this.ticketRepo.findById(ticketId);
    if (!ticket || ticket.isDeleted) throw new ApiError(404, 'Ticket not found');
    if (ticket.status === 'CLOSED' || ticket.status === 'RESOLVED') throw new ApiError(400, 'Cannot reply to a closed/resolved ticket');

    let attachments: Attachment[] = [];
    if (payload.attachments && payload.attachments.length > 0) {
      try {
        const uploaded = await cloudinary.uploadMultipleImages(payload.attachments, `support/${ticket.ticketNumber}`);
        attachments = uploaded.map((u) => ({ url: u.secure_url, publicId: u.public_id, fileName: `${u.public_id}` }));
      } catch (err) {
        console.warn('Cloudinary upload warning:', err);
      }
    }

    const messageDoc = await this.repo.create({
      ticket: ticketId,
      sender: senderId,
      message: payload.message,
      attachments,
      isInternalNote: payload.isInternalNote ?? false
    } as any);

    // update ticket lastMessageAt
    await this.ticketRepo.updateStatus(ticketId, ticket.status, { lastMessageAt: new Date(), updatedBy: senderId });

    // 1. Emit live chat event to everyone currently in the ticket room
    emitToTicket(ticketId, 'ticket:message', {
      ticketId,
      message: messageDoc,
    });

    // 2. Smart Notification Dispatch: If recipient is NOT currently in the ticket room, notify them
    try {
      const sender = await UserModel.findById(senderId).select('name role').lean();
      const isStaffSender = ['admin', 'super_admin', 'manager', 'seller'].includes(sender?.role?.toLowerCase() || '');
      const isInternalNote = !!payload.isInternalNote;

      if (!isInternalNote) {
        if (isStaffSender) {
          // Staff sent reply -> target is customer
          const customerId = String(ticket.user);
          const isCustomerInRoom = isUserInTicketRoom(ticketId, customerId);

          if (!isCustomerInRoom) {
            await notificationService.sendNotification({
              recipient: customerId,
              sender: senderId,
              title: `Reply on Ticket #${ticket.ticketNumber}`,
              message: payload.message.slice(0, 180),
              type: 'TICKET_REPLY',
              data: {
                ticketId: String(ticket._id),
                ticketNumber: ticket.ticketNumber,
                senderName: sender?.name || 'Support Agent',
              },
            });
          }
        } else {
          // Customer sent reply -> target is assigned agent or admins
          const assignedAgentId = ticket.assignedTo ? String(ticket.assignedTo) : null;
          const isAssignedAgentInRoom = assignedAgentId ? isUserInTicketRoom(ticketId, assignedAgentId) : false;

          if (assignedAgentId && !isAssignedAgentInRoom) {
            await notificationService.sendNotification({
              recipient: assignedAgentId,
              sender: senderId,
              title: `New Reply on Ticket #${ticket.ticketNumber}`,
              message: payload.message.slice(0, 180),
              type: 'TICKET_REPLY',
              data: {
                ticketId: String(ticket._id),
                ticketNumber: ticket.ticketNumber,
                customerName: sender?.name || 'Customer',
              },
            });
          } else if (!assignedAgentId) {
            // Unassigned -> notify admin team
            await notificationService.sendToRole('admin', {
              sender: senderId,
              title: `New Reply on Ticket #${ticket.ticketNumber}`,
              message: `${sender?.name || 'Customer'}: ${payload.message.slice(0, 150)}`,
              type: 'TICKET_REPLY',
              data: {
                ticketId: String(ticket._id),
                ticketNumber: ticket.ticketNumber,
              },
            });
          }
        }
      }
    } catch (notifErr) {
      console.warn('[TicketMessageService] Failed to dispatch smart notification:', notifErr);
    }

    return messageDoc;
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
