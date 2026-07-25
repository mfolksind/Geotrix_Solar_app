import { Schema, model } from 'mongoose';
import { ITicketDocument } from '../interfaces/support.interface';

const ticketSchema = new Schema<ITicketDocument>(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true },
    category: { type: String, trim: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'LOW' },
    status: { type: String, enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], default: 'OPEN', index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
    lastMessageAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ticketSchema.index({ ticketNumber: 1 });
ticketSchema.index({ user: 1 });

export default model<ITicketDocument>('Ticket', ticketSchema);
