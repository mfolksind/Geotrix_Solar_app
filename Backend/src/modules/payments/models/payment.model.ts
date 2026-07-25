import { Schema, model } from 'mongoose';
import { IPaymentDocument } from '../interfaces/payment.interface';

const paymentSchema = new Schema<IPaymentDocument>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    paymentMethod: { type: String, required: true },
    paymentProvider: { type: String, trim: true },
    transactionId: { type: String, trim: true, index: true },
    providerOrderId: { type: String, trim: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR' },
    status: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'], default: 'PENDING', index: true },
    paidAt: { type: Date },
    failureReason: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

paymentSchema.index({ order: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ status: 1 });

export default model<IPaymentDocument>('Payment', paymentSchema);
