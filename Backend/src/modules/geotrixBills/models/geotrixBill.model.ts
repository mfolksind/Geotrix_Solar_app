import { Schema, model } from 'mongoose';
import { IGeotrixBillDocument } from '../interfaces/geotrixBill.interface';

const AttachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String },
    fileName: { type: String },
  },
  { _id: false }
);

const StatusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    by: { type: Schema.Types.ObjectId, ref: 'User' },
    at: { type: Date, default: Date.now },
    remarks: { type: String },
  },
  { _id: false }
);

const geotrixBillSchema = new Schema<IGeotrixBillDocument>(
  {
    billNumber: { type: String, required: true, unique: true, index: true },
    title: { type: String, trim: true },
    description: { type: String },
    amount: { type: Number },
    monthlyBillAmount: { type: Number },
    customerName: { type: String },
    phoneNumber: { type: String },
    email: { type: String, trim: true },
    attachment: { type: [AttachmentSchema], default: [] },
    extraAttachment: { type: [AttachmentSchema], default: [] },
    projectName: { type: String, index: true },
    invoiceNumber: { type: String },
    billDate: { type: Date },
    dueDate: { type: Date },
    status: { type: String, enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID'], default: 'DRAFT', index: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], default: 'LOW', index: true },
    attachments: { type: [AttachmentSchema], default: [] },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

geotrixBillSchema.index({ billNumber: 1 });
geotrixBillSchema.index({ projectName: 1 });

export default model<IGeotrixBillDocument>('GeotrixBill', geotrixBillSchema);
