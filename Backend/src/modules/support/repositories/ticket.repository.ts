import TicketModel from '../models/ticket.model';
import { ITicketDocument } from '../interfaces/support.interface';
import { ClientSession, Types } from 'mongoose';

export class TicketRepository {
  public async create(payload: Partial<ITicketDocument>, session?: ClientSession) {
    return TicketModel.create([payload], { session }).then((docs) => docs[0]);
  }

  public async findById(id: string) {
    return TicketModel.findById(id).exec();
  }

  public async findByTicketNumber(ticketNumber: string) {
    return TicketModel.findOne({ ticketNumber }).exec();
  }

  public async findByUser(userId: string, skip = 0, limit = 20) {
    return TicketModel.find({ user: userId, isDeleted: false }).sort({ lastMessageAt: -1 }).skip(skip).limit(limit).exec();
  }

  public async findAll(filter: any, skip = 0, limit = 20) {
    return TicketModel.find(filter).sort({ lastMessageAt: -1 }).skip(skip).limit(limit).exec();
  }

  public async updateStatus(id: string, status: string, updates: Partial<ITicketDocument> = {}, session?: ClientSession) {
    return TicketModel.findByIdAndUpdate(id, { $set: { status, ...updates } }, { new: true, session }).exec();
  }

  public async assignAgent(id: string, agentId: string, session?: ClientSession) {
    return TicketModel.findByIdAndUpdate(id, { $set: { assignedTo: agentId } }, { new: true, session }).exec();
  }
}
