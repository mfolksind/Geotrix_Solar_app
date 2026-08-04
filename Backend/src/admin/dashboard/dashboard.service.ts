import { UserRepository } from '../../modules/users/user.repository';
import { CategoryRepository } from '../../modules/categories/category.repository';
import { OrderRepository } from '../../modules/orders/repositories/order.repository';
import OrderModel from '../../modules/orders/models/order.model';
import ProductModel from '../../modules/products/product.model';

export class DashboardService {
  private userRepo = new UserRepository();
  private categoryRepo = new CategoryRepository();
  private orderRepo = new OrderRepository();

  public async metrics() {
    const [users, totalProductsCount, categories, totalOrdersCount, pendingOrdersCount, completedOrdersCount] = await Promise.all([
      this.userRepo.findAll(),
      ProductModel.countDocuments({ isDeleted: false }).exec(),
      this.categoryRepo.findAll(),
      OrderModel.countDocuments({}).exec(),
      OrderModel.countDocuments({ status: 'PENDING' }).exec(),
      OrderModel.countDocuments({ status: { $in: ['COMPLETED', 'DELIVERED'] } }).exec(),
    ]);

    const totalUsers = users.length;
    const activeUsers = users.filter((u: any) => u.status === 'active').length;
    const totalProducts = totalProductsCount as number;
    const totalCategories = categories.length;
    const totalOrders = totalOrdersCount as number;
    const pendingOrders = pendingOrdersCount as number;
    const completedOrders = completedOrdersCount as number;

    return {
      totalUsers,
      activeUsers,
      totalProducts,
      totalCategories,
      totalOrders,
      pendingOrders,
      completedOrders,
    };
  }
}
