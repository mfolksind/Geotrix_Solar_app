
export interface Attachment {
  url: string;
  publicId?: string;
  fileName?: string;
}

export interface CreateBillPayload {
  title?: string;
  description?: string;
  amount?: number | string;
  monthlyBillAmount?: number | string;
  monthly_bill_amount?: number | string;
  customerName?: string;
  customer_name?: string;
  phoneNumber?: string;
  phone_number?: string;
  email?: string;
  attachment?: Attachment[] | Attachment | string | string[];
  attachments?: Attachment[] | Attachment | string | string[];
  extraAttachment?: Attachment[] | Attachment | string | string[];
  extra_attachment?: Attachment[] | Attachment | string | string[];
  projectName?: string;
  invoiceNumber?: string;
  billDate?: string; // ISO date
  dueDate?: string; // ISO date
}

export interface UpdateBillPayload {
  title?: string;
  description?: string;
  amount?: number | string;
  monthlyBillAmount?: number | string;
  monthly_bill_amount?: number | string;
  customerName?: string;
  customer_name?: string;
  phoneNumber?: string;
  phone_number?: string;
  email?: string;
  attachment?: Attachment[] | Attachment | string | string[];
  attachments?: Attachment[] | Attachment | string | string[];
  extraAttachment?: Attachment[] | Attachment | string | string[];
  extra_attachment?: Attachment[] | Attachment | string | string[];
  projectName?: string;
  invoiceNumber?: string;
  billDate?: string;
  dueDate?: string;
}

