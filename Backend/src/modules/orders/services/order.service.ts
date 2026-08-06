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

  public async createOrder(userId: string, addressId: string, clientItems: { variantId: string, quantity: number }[], notes?: string) {
    if (!clientItems || clientItems.length === 0) throw new ApiError(400, 'Cart is empty');

    // validate address
    const address = await AddressModel.findById(addressId).exec();
    if (!address) throw new ApiError(404, 'Address not found');
    if (address.user.toString() !== userId) throw new ApiError(403, 'Address does not belong to user');

    let subtotal = 0;
    const itemsData = [];

    // validate product/variant availability and calculate total
    for (const item of clientItems) {
      const variant = await ProductVariantModel.findById(item.variantId).exec();
      if (!variant) throw new ApiError(400, 'Product variant not found');
      
      const product = await ProductModel.findById(variant.product).exec();
      if (!product || (product as any).isDeleted || (product as any).status !== 'ACTIVE') throw new ApiError(400, 'Product is not available');
      
      if ((variant.stock ?? 0) < item.quantity) throw new ApiError(400, `Insufficient stock for variant ${variant.id}`);
      
      const unitPrice = variant.discountPrice || variant.price;
      const itemSubtotal = unitPrice * item.quantity;
      subtotal += itemSubtotal;
      
      itemsData.push({
        product: product.id,
        variant: variant.id,
        productName: product.name,
        variantName: variant.variantName,
        quantity: item.quantity,
        unitPrice,
        subtotal: itemSubtotal
      });
    }

    try {

      const discount = 0; // Or calculate if client provides discount codes
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

      const order = await this.orderRepo.create(orderPayload as any);

      // build order items
      const orderItems = itemsData.map((it) => ({
        order: order.id,
        product: it.product,
        variant: it.variant,
        productName: it.productName,
        variantName: it.variantName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
      }));

      await this.orderItemRepo.createMany(orderItems as any[]);

      // deduct stock
      for (const it of itemsData) {
        const variant = await ProductVariantModel.findById(it.variant).exec();
        if (!variant) throw new ApiError(400, 'Product variant not found during stock deduction');
        const newStock = (variant.stock ?? 0) - it.quantity;
        if (newStock < 0) throw new ApiError(400, 'Insufficient stock during order creation');
        await ProductVariantModel.findByIdAndUpdate(variant.id, { stock: newStock }).exec();
      }



      // return populated order
      const populated = await this.orderRepo.findById(order.id);
      return populated;
    } catch (err) {

      throw ApiError.fromUnknown(err);
    }
  }

  public async getOrder(id: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');
    const items = await this.orderItemRepo.findByOrder(id);
    
    // Return order with items array included
    return {
      ...order.toObject(),
      items
    };
  }

  public async getOrders(userId: string, isAdmin: boolean = false) {
    if (isAdmin) {
      return this.orderRepo.findAll();
    }
    return this.orderRepo.findByUser(userId);
  }

  public async cancelOrder(id: string, userId: string) {
    const order = await this.orderRepo.findById(id);
    if (!order) throw new ApiError(404, 'Order not found');
    if (order.user.toString() !== userId) throw new ApiError(403, 'Cannot cancel order');
    if (order.status === 'CANCELLED') return order;
    
    // Also mark paymentStatus as FAILED if it was pending
    if (order.paymentStatus === 'PENDING') {
      await this.orderRepo.updatePaymentStatus(id, 'FAILED');
    }
    return this.orderRepo.updateStatus(id, 'CANCELLED');
  }

  public async updateOrderStatus(id: string, status: string) {
    return this.orderRepo.updateStatus(id, status);
  }
}
