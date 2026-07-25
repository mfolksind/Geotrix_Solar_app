import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { AddressService } from '../services/address.service';
import { CreateAddressPayload, UpdateAddressPayload } from '../types/address.types';

type AuthRequest = Request & { user?: { id: string } };

export class AddressController {
  constructor(private readonly service: AddressService) {}

  public createAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const payload = req.body as CreateAddressPayload;
    payload.user = payload.user ?? req.user?.id as string;
    const address = await this.service.createAddress(payload);
    res.status(201).json({ success: true, data: address });
  });

  public getAddresses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id as string;
    const addresses = await this.service.getAddresses(userId);
    res.status(200).json({ success: true, data: addresses });
  });

  public getAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const address = await this.service.getAddress(id, userId);
    res.status(200).json({ success: true, data: address });
  });

  public updateAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const payload = req.body as UpdateAddressPayload;
    const address = await this.service.updateAddress(id, payload, userId);
    res.status(200).json({ success: true, data: address });
  });

  public setDefault = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const address = await this.service.setDefaultAddress(id, userId);
    res.status(200).json({ success: true, data: address });
  });

  public deleteAddress = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id as string;
    const deleted = await this.service.deleteAddress(id, userId);
    res.status(200).json({ success: true, data: deleted });
  });
}
