import { Document, Types } from 'mongoose';
import { Attachment, BillStatus, Priority } from '../types/geotrixBill.types';

export interface IStatusHistory {
  status: BillStatus;
  by?: Types.ObjectId | string;
  at: Date;
  remarks?: string;
}

export interface IGeotrixBillDocument extends Document {
  billNumber: string;
  title?: string;
  description?: string;
  amount?: number;
  monthlyBillAmount?: number;
  customerName?: string;
  phoneNumber?: string;
  email?: string;
  attachment?: Attachment[];
  extraAttachment?: Attachment[];
  projectName?: string;
  invoiceNumber?: string;
  billDate?: Date;
  dueDate?: Date;
  status: BillStatus;
  priority?: Priority;
  attachments: Attachment[];
  submittedBy?: Types.ObjectId | string;
  approvedBy?: Types.ObjectId | string;
  remarks?: string;
  isDeleted: boolean;
  statusHistory: IStatusHistory[];
  createdBy?: Types.ObjectId | string;
  updatedBy?: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}
