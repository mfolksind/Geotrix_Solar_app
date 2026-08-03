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
    attachments: { type: [AttachmentSchema], default: [] },
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    remarks: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

geotrixBillSchema.index({ billNumber: 1 });
geotrixBillSchema.index({ projectName: 1 });

export default model<IGeotrixBillDocument>('GeotrixBill', geotrixBillSchema);
