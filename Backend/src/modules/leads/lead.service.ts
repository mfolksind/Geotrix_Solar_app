import { Lead } from './lead.model';
import { ILead } from './lead.interface';
import { emitToAdmins } from '../../socket/socket.server';
import { NotificationService } from '../notifications/notification.service';
import logger from '../../common/logger/logger';

export interface LeadQueryParams {
  search?: string;
  status?: string;
  inquiryType?: string;
  sort?: string;
  page?: number | string;
  limit?: number | string;
}

export class LeadService {
  private notificationService = new NotificationService();

  async createLead(data: Partial<ILead>): Promise<ILead> {
    const lead = new Lead(data);
    const savedLead = await lead.save();

    // 1. Emit live real-time event to connected admin sockets
    try {
      emitToAdmins('lead:new', savedLead);
    } catch (sockErr) {
      logger.warn('[LeadService] Failed to emit lead:new socket event', sockErr);
    }

    // 2. Dispatch persistent In-App & Push Notification to Admin role
    try {
      const isProduct = savedLead.inquiryType === 'product';
      const title = isProduct
        ? `⚡ New Earthing Product Enquiry`
        : `☀️ New Solar Consultation Lead`;

      const detailText = isProduct
        ? savedLead.product?.productName || 'Earthing Equipment'
        : `${savedLead.propertyType || 'Solar'} (₹${savedLead.monthlyBill || '0'}/mo)`;

      const message = `${savedLead.fullName} from ${savedLead.city} submitted an enquiry for ${detailText}. Phone: ${savedLead.whatsappNumber}`;

      await this.notificationService.sendToRole('admin', {
        title,
        message,
        type: 'LEAD_CREATED',
        data: {
          leadId: String(savedLead._id),
          inquiryType: savedLead.inquiryType,
          fullName: savedLead.fullName,
          whatsappNumber: savedLead.whatsappNumber,
          city: savedLead.city,
          productName: savedLead.product?.productName,
        },
      });
    } catch (notifErr) {
      logger.error('[LeadService] Failed to dispatch admin notification for lead', notifErr);
    }

    return savedLead;
  }

  async getStats() {
    const [totalLeads, newLeads, contactedLeads, qualifiedLeads, lostLeads, solarLeads, productLeads] = await Promise.all([
      Lead.countDocuments({}),
      Lead.countDocuments({ status: 'New' }),
      Lead.countDocuments({ status: 'Contacted' }),
      Lead.countDocuments({ status: 'Qualified' }),
      Lead.countDocuments({ status: 'Lost' }),
      Lead.countDocuments({ inquiryType: 'solar' }),
      Lead.countDocuments({ inquiryType: 'product' }),
    ]);

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      lostLeads,
      solarLeads,
      productLeads,
    };
  }

  async getLeads(query: LeadQueryParams = {}): Promise<{ data: ILead[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = Math.max(1, parseInt(String(query.page || 1), 10) || 1);
    const hasLimit = query.limit !== undefined && query.limit !== '0' && query.limit !== 0;
    const limit = hasLimit ? Math.max(1, parseInt(String(query.limit), 10) || 15) : 0;
    const filter: any = {};

    if (query.status && query.status !== 'ALL') {
      filter.status = query.status;
    }

    if (query.inquiryType && query.inquiryType !== 'ALL') {
      filter.inquiryType = query.inquiryType;
    }

    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { fullName: { $regex: regex } },
        { city: { $regex: regex } },
        { whatsappNumber: { $regex: regex } },
        { pinCode: { $regex: regex } },
        { propertyType: { $regex: regex } },
        { monthlyBill: { $regex: regex } },
        { 'product.productName': { $regex: regex } },
        { 'product.variantName': { $regex: regex } },
        { message: { $regex: regex } },
      ];
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    let findQuery = Lead.find(filter).sort(sortOption);
    if (limit > 0) {
      findQuery = findQuery.skip((page - 1) * limit).limit(limit);
    }

    const [data, total] = await Promise.all([
      findQuery.exec(),
      Lead.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page,
      limit: limit || total,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
    };
  }

  async getLeadById(id: string): Promise<ILead | null> {
    return Lead.findById(id);
  }

  async updateLeadStatus(id: string, status: string): Promise<ILead | null> {
    return Lead.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }

  async deleteLead(id: string): Promise<ILead | null> {
    return Lead.findByIdAndDelete(id);
  }
}

