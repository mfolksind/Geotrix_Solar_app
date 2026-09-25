import TicketModel from '../../modules/support/models/ticket.model';
import TicketMessageModel from '../../modules/support/models/ticketMessage.model';
import UserModel from '../../modules/users/user.model';
import { Types } from 'mongoose';
import { emitToTicket, emitToAdmins, emitToUser, isUserInTicketRoom } from '../../socket/socket.server';
import { notificationService } from '../../modules/notifications/notification.service';
import logger from '../../common/logger/logger';

export interface AdminSupportQuery {
  page?: number | string;
  limit?: number | string;
  search?: string;
  status?: string;
  priority?: string;
  category?: string;
  sort?: string;
}

export class AdminSupportService {
  public async getStats() {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      urgentTickets,
    ] = await Promise.all([
      TicketModel.countDocuments({ isDeleted: false }),
      TicketModel.countDocuments({ isDeleted: false, status: 'OPEN' }),
      TicketModel.countDocuments({ isDeleted: false, status: 'IN_PROGRESS' }),
      TicketModel.countDocuments({ isDeleted: false, status: 'RESOLVED' }),
      TicketModel.countDocuments({ isDeleted: false, status: 'CLOSED' }),
      TicketModel.countDocuments({ isDeleted: false, priority: 'URGENT' }),
    ]);

    return {
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      urgentTickets,
    };
  }

  public async list(query: AdminSupportQuery = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status.toUpperCase();
    }

    if (query.priority && query.priority !== 'ALL') {
      filter.priority = query.priority.toUpperCase();
    }

    if (query.category && query.category !== 'ALL') {
      filter.category = query.category.toUpperCase();
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');

      const matchingUsers = await UserModel.find({
        $or: [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } },
          { phone: { $regex: searchRegex } },
        ],
      }).select('_id').lean();

      const userIds = matchingUsers.map((u) => u._id);

      filter.$or = [
        { ticketNumber: { $regex: searchRegex } },
        { subject: { $regex: searchRegex } },
        { category: { $regex: searchRegex } },
        { user: { $in: userIds } },
      ];
    }

    let sortOption: Record<string, 1 | -1> = { lastMessageAt: -1 };
    if (query.sort === 'oldest') sortOption = { createdAt: 1 };
    else if (query.sort === 'newest') sortOption = { createdAt: -1 };
    else if (query.sort === 'priority_desc') sortOption = { priority: -1 };
    else if (query.sort === 'priority_asc') sortOption = { priority: 1 };

    const ticketsQuery = TicketModel.find(filter)
      .populate('user', 'name email phone role profilePicture')
      .populate('assignedTo', 'name email role')
      .skip(skip)
      .limit(limit)
      .sort(sortOption);

    const [items, total] = await Promise.all([
      ticketsQuery.exec(),
      TicketModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async getTicketDetails(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ticket ID');

    const ticket = await TicketModel.findById(id)
      .populate('user', 'name email phone role profilePicture')
      .populate('assignedTo', 'name email role')
      .exec();

    if (!ticket) throw new Error('Ticket not found');

    const messages = await TicketMessageModel.find({ ticket: id })
      .populate('sender', 'name email role profilePicture')
      .sort({ createdAt: 1 })
      .exec();

    return {
      ticket,
      messages,
    };
  }

  public async reply(id: string, payload: { message: string; attachments?: any[]; isInternalNote?: boolean }, userId: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ticket ID');

    const ticket = await TicketModel.findById(id).exec();
    if (!ticket) throw new Error('Ticket not found');

    const message = await TicketMessageModel.create({
      ticket: id,
      sender: userId,
      message: payload.message,
      attachments: payload.attachments || [],
      isInternalNote: payload.isInternalNote ?? false,
    });

    const nextStatus = ticket.status === 'CLOSED' || ticket.status === 'RESOLVED' ? 'IN_PROGRESS' : ticket.status;

    await TicketModel.findByIdAndUpdate(id, {
      lastMessageAt: new Date(),
      status: nextStatus,
    }).exec();

    const populatedMsg = await TicketMessageModel.findById(message._id)
      .populate('sender', 'name email role profilePicture')
      .exec();

    // 1. Emit live chat event to everyone currently in the ticket room
    emitToTicket(id, 'ticket:message', {
      ticketId: id,
      message: populatedMsg || message,
    });

    // 2. If status was automatically updated to IN_PROGRESS, emit status update
    if (nextStatus !== ticket.status) {
      emitToTicket(id, 'ticket:status_changed', { ticketId: id, status: nextStatus, updatedBy: userId });
      emitToAdmins('ticket:status_changed', { ticketId: id, status: nextStatus, updatedBy: userId });
      emitToUser(String(ticket.user), 'ticket:updated', { ticketId: id, status: nextStatus });
    }

    // 3. Smart Notification Dispatch: If recipient is NOT in room, notify them
    try {
      const sender = await UserModel.findById(userId).select('name role').lean();
      const isInternalNote = !!payload.isInternalNote;

      if (!isInternalNote) {
        const customerId = String(ticket.user);
        const isCustomerInRoom = isUserInTicketRoom(id, customerId);

        if (!isCustomerInRoom) {
          await notificationService.sendNotification({
            recipient: customerId,
            sender: userId,
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
      }
    } catch (notifErr) {
      logger.warn('[AdminSupportService] Failed to dispatch reply notification:', notifErr);
    }

    return populatedMsg;
  }

  public async updateStatus(id: string, status: string, userId?: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ticket ID');
    const updatedStatus = status.toUpperCase();
    const updated = await TicketModel.findByIdAndUpdate(id, { status: updatedStatus }, { new: true })
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .exec();

    if (!updated) throw new Error('Ticket not found');

    // Emit live socket updates
    emitToTicket(id, 'ticket:status_changed', { ticketId: id, status: updatedStatus, updatedBy: userId });
    emitToAdmins('ticket:status_changed', { ticketId: id, status: updatedStatus, updatedBy: userId });
    if (updated.user) {
      const customerId = String((updated.user as any)._id || updated.user);
      emitToUser(customerId, 'ticket:updated', { ticketId: id, status: updatedStatus });

      if (customerId !== userId) {
        try {
          await notificationService.sendNotification({
            recipient: customerId,
            sender: userId,
            title: `Ticket #${updated.ticketNumber} Status: ${updatedStatus}`,
            message: `Your support ticket status has been updated to "${updatedStatus}".`,
            type: 'TICKET_STATUS',
            data: { ticketId: id, ticketNumber: updated.ticketNumber, status: updatedStatus },
          });
        } catch (err) {
          logger.warn('[AdminSupportService] Failed to notify customer on status update:', err);
        }
      }
    }

    return updated;
  }

  public async updatePriority(id: string, priority: string, userId?: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ticket ID');
    const updatedPriority = priority.toUpperCase();
    const updated = await TicketModel.findByIdAndUpdate(id, { priority: updatedPriority }, { new: true })
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .exec();

    if (!updated) throw new Error('Ticket not found');

    // Emit live socket updates
    emitToTicket(id, 'ticket:priority_changed', { ticketId: id, priority: updatedPriority, updatedBy: userId });
    emitToAdmins('ticket:priority_changed', { ticketId: id, priority: updatedPriority, updatedBy: userId });

    return updated;
  }

  public async assign(id: string, agentId: string, userId?: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ticket ID');
    const updated = await TicketModel.findByIdAndUpdate(
      id,
      { assignedTo: agentId ? new Types.ObjectId(agentId) : null },
      { new: true }
    )
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .exec();

    if (!updated) throw new Error('Ticket not found');

    // Emit live socket updates
    emitToTicket(id, 'ticket:assigned', { ticketId: id, agentId, updatedBy: userId });
    emitToAdmins('ticket:assigned', { ticketId: id, agentId, updatedBy: userId });

    if (agentId && agentId !== userId) {
      try {
        await notificationService.sendNotification({
          recipient: agentId,
          sender: userId,
          title: `Assigned to Ticket #${updated.ticketNumber}`,
          message: `You have been assigned to handle support ticket: "${updated.subject}"`,
          type: 'TICKET_STATUS',
          data: { ticketId: id, ticketNumber: updated.ticketNumber },
        });
      } catch (err) {
        logger.warn('[AdminSupportService] Failed to notify assigned agent:', err);
      }
    }

    return updated;
  }

  public async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ticket ID');
    return TicketModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).exec();
  }
}
