import TicketModel from '../../modules/support/models/ticket.model';
import TicketMessageModel from '../../modules/support/models/ticketMessage.model';
import UserModel from '../../modules/users/user.model';
import { Types } from 'mongoose';

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

    return populatedMsg;
  }

  public async updateStatus(id: string, status: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ticket ID');
    return TicketModel.findByIdAndUpdate(id, { status: status.toUpperCase() }, { new: true })
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .exec();
  }

  public async updatePriority(id: string, priority: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ticket ID');
    return TicketModel.findByIdAndUpdate(id, { priority: priority.toUpperCase() }, { new: true })
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .exec();
  }

  public async assign(id: string, agentId: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ticket ID');
    return TicketModel.findByIdAndUpdate(
      id,
      { assignedTo: agentId ? new Types.ObjectId(agentId) : null },
      { new: true }
    )
      .populate('user', 'name email phone')
      .populate('assignedTo', 'name email')
      .exec();
  }

  public async delete(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new Error('Invalid ticket ID');
    return TicketModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).exec();
  }
}
