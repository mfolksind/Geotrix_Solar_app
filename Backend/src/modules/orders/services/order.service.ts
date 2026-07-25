import mongoose from 'mongoose';
import { OrderRepository } from '../repositories/order.repository';
import { OrderItemRepository } from '../repositories/orderItem.repository';
import { CartRepository } from '../../carts/repositories/cart.repository';
import { CartItemRepository } from '../../carts/repositories/cartItem.repository';
import AddressModel from '../../addresses/models/address.model';
import ProductModel from '../../products/product.model';
import ProductVariantModel from '../../products/productVariant.model';
import { OrderRepository as OR } from '../repositories/order.repository';
import { ApiError } from '../../../common/errors/ApiError';

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${ts}-${rand}`;
}

export class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly orderItemRepo: OrderItemRepository,
    private readonly cartRepo: CartRepository,
    private readonly cartItemRepo: CartItemRepository
  ) {}

  public async createOrder(userId: string, addressId: string, notes?: string) {
    // load cart
    const cart = await this.cartRepo.findByUser(userId);
    if (!cart || cart.totalItems === 0) throw new ApiError(400, 'Cart is empty');

    // validate address
    const address = await AddressModel.findById(addressId).exec();
    if (!address) throw new ApiError(404, 'Address not found');
    if (address.user.toString() !== userId) throw new ApiError(403, 'Address does not belong to user');

    const items = await this.cartItemRepo.findByCart(cart.id);
    if (!items.length) throw new ApiError(400, 'Cart has no items');

    // validate product/variant availability
    for (const item of items) {
      const variant = await ProductVariantModel.findById(item.variant).exec();
      if (!variant) throw new ApiError(400, 'Product variant not found');
      const product = await ProductModel.findById(item.product).exec();
      if (!product || (product as any).isDeleted || (product as any).status !== 'ACTIVE') throw new ApiError(400, 'Product is not available');
      if ((variant.stock ?? 0) < item.quantity) throw new ApiError(400, `Insufficient stock for variant ${variant.id}`);
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const subtotal = cart.totalAmount;
      const discount = (cart as any).discountAmount ?? 0;
      const taxRate = Number(process.env.ORDER_TAX_RATE ?? 0.0);
      const tax = subtotal * taxRate;
      const shippingCharge = Number(process.env.SHIPPING_CHARGE ?? 0);
      const totalAmount = subtotal + tax + shippingCharge - discount;

      const orderPayload = {
        orderNumber: generateOrderNumber(),
        user: userId,
        address: addressId,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        subtotal,
        shippingCharge,
        discount,
        tax,
        totalAmount,
        notes,
      } as const;

      const order = await this.orderRepo.create(orderPayload as any, session);

      // build order items
      const orderItems = items.map((it) => ({
        order: order.id,
        product: it.product,
        variant: it.variant,
        productName: (it as any).product?.name ?? '',
        variantName: (it as any).variant?.variantName ?? '',
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
      }));

      await this.orderItemRepo.createMany(orderItems as any[], session);

      // deduct stock
      for (const it of items) {
        const variant = await ProductVariantModel.findById(it.variant).session(session).exec();
        if (!variant) throw new ApiError(400, 'Product variant not found during stock deduction');
        const newStock = (variant.stock ?? 0) - it.quantity;
        if (newStock < 0) throw new ApiError(400, 'Insufficient stock during order creation');
        await ProductVariantModel.findByIdAndUpdate(variant.id, { stock: newStock }, { session }).exec();
      }

      // clear cart items and reset cart totals
      await Promise.all(items.map((i) => this.cartItemRepo.delete(i.id)));
      await this.cartRepo.clearCart(cart.id);

      await session.commitTransaction();
      session.endSession();

      // return populated order
      const populated = await this.orderRepo.findById(order.id);
      return populated;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw ApiError.fromUnknown(err);
    }
  }

  public async getOrder(id: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');
    return order;
  }

  public async getOrders(userId: string) {
    return this.orderRepo.findByUser(userId);
  }

  public async cancelOrder(id: string, userId: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.user.toString() !== userId) throw new ApiError(403, 'Cannot cancel order');
    if (order.status === 'CANCELLED') return order;
    return this.orderRepo.updateStatus(id, 'CANCELLED');
  }

  public async updateOrderStatus(id: string, status: string) {
    return this.orderRepo.updateStatus(id, status);
  }
}
