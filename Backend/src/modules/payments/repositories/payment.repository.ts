import PaymentModel from '../models/payment.model';
import { IPaymentDocument } from '../interfaces/payment.interface';
import { ClientSession, Types } from 'mongoose';

export class PaymentRepository {
  public async create(payload: Partial<IPaymentDocument>, session?: ClientSession) {
    return PaymentModel.create([payload], { session }).then((docs) => docs[0]);
  }

  public async findByOrder(orderId: string) {
    return PaymentModel.find({ order: orderId }).sort({ createdAt: -1 }).exec();
  }

  public async findByTransactionId(transactionId: string) {
    return PaymentModel.findOne({ transactionId }).exec();
  }

  public async updateStatus(id: string, status: string, updates: Partial<IPaymentDocument> = {}, session?: ClientSession) {
    return PaymentModel.findByIdAndUpdate(id, { $set: { status, ...updates } }, { new: true, session }).exec();
  }
}
