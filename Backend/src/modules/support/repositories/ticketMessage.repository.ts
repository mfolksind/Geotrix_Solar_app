import TicketMessageModel from '../models/ticketMessage.model';
import { ITicketMessageDocument } from '../interfaces/support.interface';
import { ClientSession } from 'mongoose';

export class TicketMessageRepository {
  public async create(payload: Partial<ITicketMessageDocument>, session?: ClientSession) {
    return TicketMessageModel.create([payload], { session }).then((docs) => docs[0]);
  }

  public async findByTicket(ticketId: string, skip = 0, limit = 50) {
    return TicketMessageModel.find({ ticket: ticketId }).sort({ createdAt: 1 }).skip(skip).limit(limit).exec();
  }

  public async delete(id: string) {
    return TicketMessageModel.findByIdAndDelete(id).exec();
  }
}
