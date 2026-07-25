import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { CartService } from '../services/cart.service';
import { AddItemPayload, UpdateItemPayload } from '../types/cart.types';

type AuthRequest = Request & { user?: { id: string } };

export class CartController {
  constructor(private readonly service: CartService) {}

  public getCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id as string;
    const result = await this.service.getCart(userId);
    res.status(200).json({ success: true, data: result });
  });

  public addItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id as string;
    const payload = req.body as AddItemPayload;
    const item = await this.service.addToCart(userId, payload.productId, payload.quantity, payload.variantId);
    res.status(201).json({ success: true, data: item });
  });

  public updateItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { itemId } = req.params as { itemId: string };
    const payload = req.body as UpdateItemPayload;
    const item = await this.service.updateCartItem(itemId, payload.quantity);
    res.status(200).json({ success: true, data: item });
  });

  public removeItem = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { itemId } = req.params as { itemId: string };
    const deleted = await this.service.removeCartItem(itemId);
    res.status(200).json({ success: true, data: deleted });
  });

  public clearCart = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id as string;
    const deleted = await this.service.clearCart(userId);
    res.status(200).json({ success: true, data: deleted });
  });
}
