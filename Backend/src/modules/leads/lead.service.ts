import { Lead } from './lead.model';
import { ILead } from './lead.interface';

export interface LeadQueryParams {
  search?: string;
  status?: string;
  sort?: string;
  page?: number | string;
  limit?: number | string;
}

export class LeadService {
  async createLead(data: Partial<ILead>): Promise<ILead> {
    const lead = new Lead(data);
    return lead.save();
  }

  async getStats() {
    const [totalLeads, newLeads, contactedLeads, qualifiedLeads, lostLeads] = await Promise.all([
      Lead.countDocuments({}),
      Lead.countDocuments({ status: 'New' }),
      Lead.countDocuments({ status: 'Contacted' }),
      Lead.countDocuments({ status: 'Qualified' }),
      Lead.countDocuments({ status: 'Lost' }),
    ]);

    return {
      totalLeads,
      newLeads,
      contactedLeads,
      qualifiedLeads,
      lostLeads,
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

    if (query.search && query.search.trim()) {
      const regex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { fullName: { $regex: regex } },
        { city: { $regex: regex } },
        { whatsappNumber: { $regex: regex } },
        { pinCode: { $regex: regex } },
        { propertyType: { $regex: regex } },
        { monthlyBill: { $regex: regex } },
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

