import mongoose from 'mongoose';
import { GeotrixBillRepository } from '../repositories/geotrixBill.repository';
import { Attachment, CreateBillPayload, UpdateBillPayload } from '../types/geotrixBill.types';
import { ApiError } from '../../../common/errors/ApiError';
import { IGeotrixBillDocument } from '../interfaces/geotrixBill.interface';

function generateBillNumber(): string {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `GB-${ts}-${rand}`;
}

function normalizeAmount(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  }
  return undefined;
}

function normalizeAttachments(value: unknown): Attachment[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeAttachments(item));
  }
  if (typeof value === 'string') {
    return value.trim() ? [{ url: value.trim() }] : [];
  }
  if (typeof value === 'object') {
    const candidate = value as Record<string, unknown>;
    if (typeof candidate.url === 'string' && candidate.url.trim()) {
      return [{ url: candidate.url.trim(), publicId: typeof candidate.publicId === 'string' ? candidate.publicId : undefined, fileName: typeof candidate.fileName === 'string' ? candidate.fileName : undefined }];
    }
  }
  return [];
}

export class GeotrixBillService {
  constructor(private readonly repo: GeotrixBillRepository) {}

  public async createBill(payload: CreateBillPayload, userId?: string) {
    const billNumber = generateBillNumber();
    const normalizedPayload = payload as CreateBillPayload & Record<string, unknown>;
    const customerName = typeof normalizedPayload.customerName === 'string' && normalizedPayload.customerName.trim()
      ? normalizedPayload.customerName.trim()
      : typeof normalizedPayload.customer_name === 'string' && normalizedPayload.customer_name.trim()
        ? normalizedPayload.customer_name.trim()
        : undefined;
    const phoneNumber = typeof normalizedPayload.phoneNumber === 'string' && normalizedPayload.phoneNumber.trim()
      ? normalizedPayload.phoneNumber.trim()
      : typeof normalizedPayload.phone_number === 'string' && normalizedPayload.phone_number.trim()
        ? normalizedPayload.phone_number.trim()
        : undefined;
    const email = typeof normalizedPayload.email === 'string' && normalizedPayload.email.trim() ? normalizedPayload.email.trim() : undefined;
    const monthlyBillAmount = normalizeAmount(normalizedPayload.monthlyBillAmount ?? normalizedPayload.monthly_bill_amount ?? payload.amount);
    const attachmentValue = normalizedPayload.attachment ?? normalizedPayload.attachments;
    const extraAttachmentValue = normalizedPayload.extraAttachment ?? normalizedPayload.extra_attachment;
    const attachments = normalizeAttachments(attachmentValue);
    const extraAttachments = normalizeAttachments(extraAttachmentValue);
    const title = typeof payload.title === 'string' && payload.title.trim() ? payload.title.trim() : customerName ? `${customerName} bill` : 'Geotrix Bill';
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const doc = await this.repo.create(
        {
          billNumber,
          title,
          description: payload.description,
          amount: monthlyBillAmount,
          monthlyBillAmount,
          customerName,
          phoneNumber,
          email,
          attachment: attachments,
          extraAttachment: extraAttachments,
          projectName: typeof normalizedPayload.projectName === 'string' ? normalizedPayload.projectName : undefined,
          invoiceNumber: typeof normalizedPayload.invoiceNumber === 'string' ? normalizedPayload.invoiceNumber : undefined,
          billDate: payload.billDate ? new Date(payload.billDate) : undefined,
          dueDate: payload.dueDate ? new Date(payload.dueDate) : undefined,
          attachments,
          submittedBy: userId,
          createdBy: userId,
        },
        session
      );
      await session.commitTransaction();
      session.endSession();
      return doc;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw ApiError.fromUnknown(err);
    }
  }

  public async getBill(id: string) {
    const bill = await this.repo.findById(id);
    if (!bill) throw new ApiError(404, 'Bill not found');
    return bill;
  }

  public async getBills(query: Record<string, unknown>) {
    const page = query.page ? Number(query.page) : 1;
    const limit = query.limit ? Number(query.limit) : 20;
    const search = typeof query.search === 'string' ? query.search : undefined;
    const project = typeof query.project === 'string' ? query.project : undefined;
    const startDate = typeof query.startDate === 'string' ? new Date(query.startDate) : undefined;
    const endDate = typeof query.endDate === 'string' ? new Date(query.endDate) : undefined;
    const sortDir = query.sortDir === 'asc' ? 1 : -1;
    let sort: Record<string, 1 | -1>;
    if (typeof query.sortBy === 'string') {
      sort = { [query.sortBy]: (sortDir === 1 ? 1 : -1) as 1 | -1 };
    } else {
      sort = { updatedAt: -1 };
    }

    return this.repo.findAll({ page, limit, search, project, startDate, endDate, sort });
  }

  public async updateBill(id: string, payload: UpdateBillPayload, userId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new ApiError(404, 'Bill not found');
    const normalizedPayload = payload as UpdateBillPayload & Record<string, unknown>;
    const updates: Partial<IGeotrixBillDocument> = { updatedBy: userId } as Partial<IGeotrixBillDocument>;

    if (payload.title !== undefined) updates.title = payload.title.trim() ? payload.title.trim() : undefined;
    if (payload.description !== undefined) updates.description = payload.description;
    const monthlyBillAmount = normalizeAmount(normalizedPayload.monthlyBillAmount ?? normalizedPayload.monthly_bill_amount ?? payload.amount);
    if (monthlyBillAmount !== undefined) {
      updates.monthlyBillAmount = monthlyBillAmount;
      updates.amount = monthlyBillAmount;
    }

    if (typeof normalizedPayload.customerName === 'string' && normalizedPayload.customerName.trim()) {
      updates.customerName = normalizedPayload.customerName.trim();
    } else if (typeof normalizedPayload.customer_name === 'string' && normalizedPayload.customer_name.trim()) {
      updates.customerName = normalizedPayload.customer_name.trim();
    }

    if (typeof normalizedPayload.phoneNumber === 'string' && normalizedPayload.phoneNumber.trim()) {
      updates.phoneNumber = normalizedPayload.phoneNumber.trim();
    } else if (typeof normalizedPayload.phone_number === 'string' && normalizedPayload.phone_number.trim()) {
      updates.phoneNumber = normalizedPayload.phone_number.trim();
    }

    if (typeof normalizedPayload.email === 'string' && normalizedPayload.email.trim()) {
      updates.email = normalizedPayload.email.trim();
    }

    if (normalizedPayload.attachment !== undefined || normalizedPayload.attachments !== undefined) {
      const attachments = normalizeAttachments(normalizedPayload.attachment ?? normalizedPayload.attachments);
      updates.attachment = attachments;
      updates.attachments = attachments;
    }

    if (normalizedPayload.extraAttachment !== undefined || normalizedPayload.extra_attachment !== undefined) {
      updates.extraAttachment = normalizeAttachments(normalizedPayload.extraAttachment ?? normalizedPayload.extra_attachment);
    }

    if (typeof normalizedPayload.projectName === 'string') updates.projectName = normalizedPayload.projectName;
    if (typeof normalizedPayload.invoiceNumber === 'string') updates.invoiceNumber = normalizedPayload.invoiceNumber;
    if (payload.billDate) updates.billDate = new Date(payload.billDate);
    if (payload.dueDate) updates.dueDate = new Date(payload.dueDate);
    if (payload.dueDate) updates.dueDate = new Date(payload.dueDate);

    return this.repo.update(existing.id, updates);
  }


  public async softDelete(id: string, userId: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new ApiError(404, 'Bill not found');
    return this.repo.softDelete(id);
  }
}
