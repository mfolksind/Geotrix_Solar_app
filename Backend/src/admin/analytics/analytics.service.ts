import OrderModel from '../../modules/orders/models/order.model';
import { ProductRepository } from '../../modules/products/product.repository';
import { UserRepository } from '../../modules/users/user.repository';
import ProductModel from '../../modules/products/product.model';

export class AnalyticsService {
  private productRepo = new ProductRepository();
  private userRepo = new UserRepository();

  public async sales(period: { from?: Date; to?: Date }) {
    const match: any = {};
    if (period.from) match.createdAt = { $gte: period.from };
    if (period.to) match.createdAt = match.createdAt ? { ...match.createdAt, $lte: period.to } : { $lte: period.to };
    const result = await OrderModel.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]).exec();
    return { total: result[0]?.total ?? 0 };
  }

  public async orders(period: { from?: Date; to?: Date }) {
    const match: any = {};
    if (period.from) match.createdAt = { $gte: period.from };
    if (period.to) match.createdAt = match.createdAt ? { ...match.createdAt, $lte: period.to } : { $lte: period.to };
    const total = await OrderModel.countDocuments(match).exec();
    return { total };
  }

  public async products() {
    return this.productRepo.findAll({}) ?? [];
  }

  public async users() {
    return this.userRepo.findAll() ?? [];
  }

  public async revenue(period: { from?: Date; to?: Date }) {
    return this.sales(period);
  }
}
