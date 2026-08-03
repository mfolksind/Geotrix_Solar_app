import { Document, Types } from 'mongoose';
import { Attachment } from '../types/geotrixBill.types';


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
  attachments: Attachment[];
  submittedBy?: Types.ObjectId | string;
  approvedBy?: Types.ObjectId | string;
  remarks?: string;
  isDeleted: boolean;
  createdBy?: Types.ObjectId | string;
  updatedBy?: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}
