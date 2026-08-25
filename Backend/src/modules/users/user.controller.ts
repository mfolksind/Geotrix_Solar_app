import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { UserService } from './user.service';
import { UpdateProfilePayload, ChangeStatusPayload, UserQuery, ApproveFamilyPayload } from './user.types';

type AuthRequest = Request & { user?: { id: string; role?: string } };

export class UserController {
  constructor(private readonly userService: UserService) {}

  public getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user?.id;
    const user = await this.userService.getProfile(userId as string);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  public updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.params.id ?? req.user?.id;
    const payload = req.body as UpdateProfilePayload;
    const user = await this.userService.updateProfile(userId as string, payload);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  public getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = await this.userService.getUserById(id);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  public getCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const role = req.user.role?.toLowerCase();
    if (role !== 'admin' && role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Only admins can fetch customers' });
      return;
    }

    const users = await this.userService.getAllUsers({ role: 'customer' });

    res.status(200).json({
      success: true,
      data: users,
    });
  });

  public getAdmins = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const role = req.user.role?.toLowerCase();
    if (role !== 'super_admin') {
      res.status(403).json({ success: false, message: 'Only super admin can fetch admin users' });
      return;
    }

    const users = await this.userService.getAllUsers({ role: 'admin' });

    res.status(200).json({
      success: true,
      data: users,
    });
  });

  public changeUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body as ChangeStatusPayload;
    const user = await this.userService.changeUserStatus(id, payload);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  public approveFamily = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const payload = req.body as ApproveFamilyPayload;
    const user = await this.userService.approveFamily(id, payload);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  public changeUserFamily = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { family } = req.body;
    const user = await this.userService.changeUserFamily(id, family);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  public deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const deleted = await this.userService.deleteUser(id);

    res.status(200).json({
      success: true,
      data: deleted,
    });
  });
}
