import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { OrderService } from '../services/order.service';
import { CreateOrderPayload, UpdateOrderStatusPayload } from '../types/order.types';

type AuthRequest = Request & { user?: { id: string } };

export class OrderController {
  constructor(private readonly service: OrderService) {}

  public createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payload = req.body as CreateOrderPayload;
    const userId = req.user?.id as string;
    const order = await this.service.createOrder(userId, payload.addressId, payload.notes);
    res.status(201).json({ success: true, data: order });
  });

  public getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id as string;
    const orders = await this.service.getOrders(userId);
    res.status(200).json({ success: true, data: orders });
  });

  public getOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const order = await this.service.getOrder(id);
    res.status(200).json({ success: true, data: order });
  });

  public updateStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const payload = req.body as UpdateOrderStatusPayload;
    const order = await this.service.updateOrderStatus(id, payload.status);
    res.status(200).json({ success: true, data: order });
  });

  public cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const order = await this.service.cancelOrder(id, userId);
    res.status(200).json({ success: true, data: order });
  });
}
