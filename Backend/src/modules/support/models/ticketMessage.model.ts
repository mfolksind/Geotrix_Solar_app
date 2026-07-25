import { Schema, model } from 'mongoose';
import { ITicketMessageDocument } from '../interfaces/support.interface';

const attachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    fileName: { type: String },
  },
  { _id: false }
);

const ticketMessageSchema = new Schema<ITicketMessageDocument>(
  {
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    attachments: { type: [attachmentSchema], default: [] },
    isInternalNote: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ticketMessageSchema.index({ ticket: 1 });

export default model<ITicketMessageDocument>('TicketMessage', ticketMessageSchema);
