import { Lead } from './lead.model';
import { ILead } from './lead.interface';

export class LeadService {
  async createLead(data: Partial<ILead>): Promise<ILead> {
    const lead = new Lead(data);
    return lead.save();
  }

  async getLeads(query: any = {}): Promise<{ data: ILead[]; total: number; page: number; totalPages: number }> {
    const { page = 1, limit = 10, status, search } = query;
    const filter: any = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { whatsappNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Lead.countDocuments(filter)
    ]);

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async updateLeadStatus(id: string, status: string): Promise<ILead | null> {
    return Lead.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }
}
