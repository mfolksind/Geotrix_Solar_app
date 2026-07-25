import { Request, Response } from 'express';
import asyncHandler from '../../../common/utils/asyncHandler';
import { GeotrixBillService } from '../services/geotrixBill.service';

type AuthRequest = Request & { user?: { id?: string; role?: string } };

export class GeotrixBillController {
  constructor(private readonly service: GeotrixBillService) {}

  public create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payload = req.body;
    const userId = req.user?.id;
    const created = await this.service.createBill(payload, userId);
    res.status(201).json({ success: true, data: created });
  });

  public list = asyncHandler(async (req: Request, res: Response) => {
    const result = await this.service.getBills(req.query as Record<string, unknown>);
    res.status(200).json({ success: true, data: result });
  });

  public get = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const bill = await this.service.getBill(id);
    res.status(200).json({ success: true, data: bill });
  });

  public update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const payload = req.body;
    const userId = req.user?.id as string;
    const updated = await this.service.updateBill(id, payload, userId);
    res.status(200).json({ success: true, data: updated });
  });

  public updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const payload = req.body;
    const userId = req.user?.id as string;
    const updated = await this.service.updateStatus(id, payload, userId);
    res.status(200).json({ success: true, data: updated });
  });

  public delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const userId = req.user?.id as string;
    const deleted = await this.service.softDelete(id, userId);
    res.status(200).json({ success: true, data: deleted });
  });
}
