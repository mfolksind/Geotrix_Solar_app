import bcrypt from 'bcrypt';
import UserModel from '../../modules/users/user.model';
import AddressModel from '../../modules/addresses/models/address.model';
import CartModel from '../../modules/carts/models/cart.model';
import CartItemModel from '../../modules/carts/models/cartItem.model';
import OrderModel from '../../modules/orders/models/order.model';
import FamilyModel from '../../modules/families/family.model';
import { sendEmail } from '../../common/services/email/email.service';
import { Types } from 'mongoose';

export interface AdminUserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
  familyApprovalStatus?: string;
  family?: string;
  sort?: string;
}

export class AdminUserService {
  public async getStats() {
    const [
      totalUsers,
      activeUsers,
      pendingApproval,
      blockedUsers,
      adminUsers,
      customerUsers,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ status: 'active' }),
      UserModel.countDocuments({ familyApprovalStatus: 'pending' }),
      UserModel.countDocuments({ status: { $in: ['inactive', 'blocked'] } }),
      UserModel.countDocuments({ role: { $in: ['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'] } }),
      UserModel.countDocuments({ role: { $in: ['customer', 'user', 'CUSTOMER', 'USER'] } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      pendingApproval,
      blockedUsers,
      adminUsers,
      customerUsers,
    };
  }

  public async listUsers(query: AdminUserQuery = {}) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filters: Record<string, unknown> = {};

    if (query.role && query.role !== 'ALL') {
      filters.role = query.role.toLowerCase();
    }

    if (query.status && query.status !== 'ALL') {
      filters.status = query.status.toLowerCase();
    }

    if (query.familyApprovalStatus && query.familyApprovalStatus !== 'ALL') {
      filters.familyApprovalStatus = query.familyApprovalStatus.toLowerCase();
    }

    if (query.family && query.family !== 'ALL' && Types.ObjectId.isValid(query.family)) {
      filters.family = new Types.ObjectId(query.family);
    }

    if (query.search && query.search.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filters.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
    if (query.sort === 'oldest') sortOption = { createdAt: 1 };
    else if (query.sort === 'name_asc') sortOption = { name: 1 };
    else if (query.sort === 'name_desc') sortOption = { name: -1 };
    else if (query.sort === 'role_asc') sortOption = { role: 1 };

    const usersQuery = UserModel.find(filters)
      .populate('family', 'name slug requiresAdminApproval')
      .skip(skip)
      .limit(limit)
      .sort(sortOption);

    const [items, total] = await Promise.all([
      usersQuery.exec(),
      UserModel.countDocuments(filters).exec(),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  public async getUserDetails(userId: string) {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID');
    }

    const user = await UserModel.findById(userId)
      .populate('family', 'name slug requiresAdminApproval')
      .populate('approvedFamilies', 'name slug')
      .exec();

    if (!user) {
      throw new Error('User not found');
    }

    // Fetch user's addresses
    const addresses = await AddressModel.find({ user: userId, isDeleted: false })
      .sort({ isDefault: -1, createdAt: -1 })
      .exec();

    // Fetch user's active cart and items
    const cart = await CartModel.findOne({ user: userId }).exec();
    let cartItems: any[] = [];
    if (cart) {
      cartItems = await CartItemModel.find({ cart: cart._id })
        .populate('product', 'name slug price images status')
        .populate('variant', 'title sku price discountPrice images stock status')
        .exec();
    }

    // Fetch user's orders
    const [recentOrders, orderCount] = await Promise.all([
      OrderModel.find({ user: userId }).sort({ createdAt: -1 }).limit(5).exec(),
      OrderModel.countDocuments({ user: userId }).exec(),
    ]);

    return {
      user,
      addresses,
      cart: {
        summary: cart,
        items: cartItems,
      },
      orders: {
        total: orderCount,
        recent: recentOrders,
      },
    };
  }

  public async getUser(userId: string) {
    return this.getUserDetails(userId);
  }

  public async createUser(payload: any) {
    const existing = await UserModel.findOne({ email: payload.email.toLowerCase() }).exec();
    if (existing) {
      throw new Error('Email is already registered');
    }

    let passwordHash: string | undefined;
    if (payload.password) {
      passwordHash = await bcrypt.hash(payload.password, 12);
    }

    let familyApprovalStatus = payload.familyApprovalStatus || null;
    let initialStatus = payload.status || 'active';

    if (payload.family) {
      const family = await FamilyModel.findById(payload.family);
      if (family && family.requiresAdminApproval && !familyApprovalStatus) {
        familyApprovalStatus = 'approved';
      }
    }

    const created = await UserModel.create({
      name: payload.name,
      email: payload.email.toLowerCase(),
      password: passwordHash,
      phone: payload.phone,
      role: (payload.role || 'customer').toLowerCase(),
      family: payload.family || undefined,
      familyApprovalStatus: familyApprovalStatus || 'approved',
      approvedFamilies: payload.family ? [payload.family] : [],
      status: initialStatus.toLowerCase(),
      isVerified: payload.isVerified ?? true,
    });

    return created;
  }

  public async updateUser(userId: string, payload: any) {
    if (!Types.ObjectId.isValid(userId)) throw new Error('Invalid user ID');

    const updateData: Record<string, any> = {};

    if (payload.name) updateData.name = payload.name;
    if (payload.email) updateData.email = payload.email.toLowerCase();
    if (payload.phone !== undefined) updateData.phone = payload.phone;
    if (payload.role) updateData.role = payload.role.toLowerCase();
    if (payload.status) updateData.status = payload.status.toLowerCase();
    if (payload.familyApprovalStatus) updateData.familyApprovalStatus = payload.familyApprovalStatus.toLowerCase();
    if (payload.isVerified !== undefined) updateData.isVerified = payload.isVerified;

    if (payload.family !== undefined) {
      updateData.family = payload.family ? payload.family : null;
      if (payload.family) {
        const user = await UserModel.findById(userId);
        const approved = user?.approvedFamilies?.some((f) => f.toString() === payload.family.toString());
        if (!approved) {
          updateData.approvedFamilies = [...(user?.approvedFamilies || []), payload.family];
        }
      }
    }

    if (payload.password) {
      updateData.password = await bcrypt.hash(payload.password, 12);
    }

    const updated = await UserModel.findByIdAndUpdate(userId, updateData, { new: true })
      .populate('family', 'name slug requiresAdminApproval')
      .exec();

    return updated;
  }

  public async updateRole(userId: string, role: string) {
    return UserModel.findByIdAndUpdate(userId, { role: role.toLowerCase() }, { new: true }).exec();
  }

  public async changeStatus(userId: string, payload: { status: string }) {
    return UserModel.findByIdAndUpdate(userId, { status: payload.status.toLowerCase() }, { new: true }).exec();
  }

  public async approveFamily(userId: string, payload: { status: 'approved' | 'rejected' | 'pending' }) {
    const user = await UserModel.findById(userId);
    if (!user || !user.family) throw new Error('User or family not found');

    const updatePayload: any = { familyApprovalStatus: payload.status };

    if (payload.status === 'approved') {
      updatePayload.status = 'active';
      const isAlreadyApproved = user.approvedFamilies?.some((f) => f.toString() === user.family?.toString());
      if (!isAlreadyApproved) {
        updatePayload.approvedFamilies = [...(user.approvedFamilies || []), user.family];
      }
    } else if (payload.status === 'rejected') {
      updatePayload.status = 'inactive';
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updatePayload, { new: true })
      .populate('family', 'name slug')
      .exec();

    if (updatedUser) {
      const family = await FamilyModel.findById(updatedUser.family);
      try {
        await sendEmail({
          to: updatedUser.email,
          subject: `Your family request has been ${payload.status}`,
          text: `Your request to join the family ${family?.name || ''} has been ${payload.status}.`,
          html: `<p>Your request to join the family <b>${family?.name || ''}</b> has been ${payload.status}.</p>`,
        });
      } catch (error) {
        console.error('Failed to send approval email:', error);
      }
    }

    return updatedUser;
  }

  public async changeUserFamily(userId: string, familyId: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('User not found');

    const updatePayload: any = {
      family: familyId,
      familyApprovalStatus: 'approved',
      status: 'active',
    };

    const isAlreadyApproved = user.approvedFamilies?.some((f) => f.toString() === familyId);
    if (!isAlreadyApproved) {
      updatePayload.approvedFamilies = [...(user.approvedFamilies || []), familyId];
    }

    return UserModel.findByIdAndUpdate(userId, updatePayload, { new: true })
      .populate('family', 'name slug')
      .exec();
  }

  public async deleteUser(userId: string) {
    return UserModel.findByIdAndDelete(userId).exec();
  }
}
