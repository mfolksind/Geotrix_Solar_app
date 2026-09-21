import { Request, Response } from 'express';
import asyncHandler from '../../common/utils/asyncHandler';
import { LeadService } from './lead.service';
import { ApiError } from '../../common/errors/ApiError';

export class LeadController {
  private service: LeadService;

  constructor(service: LeadService) {
    this.service = service;
  }

  getStats = asyncHandler(async (_req: Request, res: Response) => {
    const stats = await this.service.getStats();
    return res.status(200).json({
      success: true,
      data: stats,
    });
  });

  createLead = asyncHandler(async (req: Request, res: Response) => {
    const lead = await this.service.createLead(req.body);
    return res.status(201).json({
      success: true,
      message: 'Consultation request submitted successfully!',
      data: lead,
    });
  });

  getLeads = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.getLeads(req.query);
    return res.status(200).json({
      success: true,
      data: result.data,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      }
    });
  });

  getLeadById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const lead = await this.service.getLeadById(id);
    if (!lead) {
      throw new ApiError(404, 'Lead not found');
    }
    return res.status(200).json({
      success: true,
      data: lead,
    });
  });

  updateLeadStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    
    const lead = await this.service.updateLeadStatus(id, status);
    if (!lead) {
      throw new ApiError(404, 'Lead not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Lead status updated',
      data: lead,
    });
  });

  deleteLead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await this.service.deleteLead(id);
    if (!deleted) {
      throw new ApiError(404, 'Lead not found');
    }

    return res.status(200).json({
      success: true,
      message: 'Lead deleted successfully',
    });
  });
}

