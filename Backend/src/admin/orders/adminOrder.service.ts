import { OrderRepository } from '../../modules/orders/repositories/order.repository';
import OrderModel from '../../modules/orders/models/order.model';
import { OrderService } from '../../modules/orders/services/order.service';
import { OrderItemRepository } from '../../modules/orders/repositories/orderItem.repository';
import { CartRepository } from '../../modules/carts/repositories/cart.repository';
import { CartItemRepository } from '../../modules/carts/repositories/cartItem.repository';

export class AdminOrderService {
  private orderRepo = new OrderRepository();
  private orderItemRepo = new OrderItemRepository();
  private cartRepo = new CartRepository();
  private cartItemRepo = new CartItemRepository();
  private service = new OrderService(this.orderRepo, this.orderItemRepo, this.cartRepo, this.cartItemRepo);

  public async list(query: Record<string, unknown>) {
    const q: any = {};
    if (query.search) q.orderNumber = { $regex: String(query.search), $options: 'i' };
    if (query.status) q.status = query.status;
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 20);
    const skip = (page - 1) * limit;
    const items = await OrderModel.find(q).skip(skip).limit(limit).exec();
    const total = await OrderModel.countDocuments(q).exec();
    return { items, total, page, limit };
  }

  public async get(id: string) {
    return this.service.getOrder(id);
  }

  public async updateStatus(id: string, status: string) {
    return this.service.updateOrderStatus(id, status);
  }

  public async updatePaymentStatus(id: string, status: string) {
    return OrderModel.findByIdAndUpdate(id, { paymentStatus: status }, { new: true }).exec();
  }

  public async updateShipping(id: string, payload: Record<string, unknown>) {
    return OrderModel.findByIdAndUpdate(id, { $set: { shipping: payload } } as any, { new: true }).exec();
  }

  public async cancel(id: string) {
    return this.orderRepo.updateStatus(id, 'CANCELLED');
  }
}
