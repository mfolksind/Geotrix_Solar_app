import { CartRepository } from '../repositories/cart.repository';
import { CartItemRepository } from '../repositories/cartItem.repository';
import ProductVariantModel from '../../products/productVariant.model';
import ProductModel from '../../products/product.model';
import { ICartBillingBreakup } from '../interfaces/cart.interface';
import { emitToUser } from '../../../socket/socket.server';

export class CartService {
  constructor(private readonly cartRepo: CartRepository, private readonly itemRepo: CartItemRepository) {}

  public async getCart(userId: string) {
    let cart = await this.cartRepo.findByUser(userId);
    if (!cart) cart = await this.cartRepo.create(userId);

    const items = await this.itemRepo.findByCart(cart.id);

    // Build standard 18% GST billing breakdown
    const billing = this.calculateBilling(items, cart.discountAmount || 0, cart.shippingFee || 0);

    return {
      cart,
      items,
      billing,
    };
  }

  public async addToCart(userId: string, productId: string, quantity: number, variantId?: string) {
    let cart = await this.cartRepo.findByUser(userId);
    if (!cart) cart = await this.cartRepo.create(userId);

    let variant;
    if (variantId) {
      variant = await ProductVariantModel.findById(variantId).exec();
    } else {
      variant = await ProductVariantModel.findOne({ product: productId, status: 'ACTIVE', isDefault: true }).exec();
      if (!variant) {
        variant = await ProductVariantModel.findOne({ product: productId, status: 'ACTIVE' }).exec();
      }
    }
    if (!variant) throw new Error('Product variant not found');

    const existing = await this.itemRepo.findByVariant(cart.id, variant.id);
    let item;
    if (existing) {
      const newQty = existing.quantity + quantity;
      const unitPrice = variant.discountPrice ?? variant.price;
      item = await this.itemRepo.update(existing.id, { quantity: newQty, subtotal: unitPrice * newQty });
      await this.recalculateTotals(cart.id);
    } else {
      const unitPrice = variant.discountPrice ?? variant.price;
      const productIdValue =
        (variant.product as unknown) && typeof (variant.product as any)._id !== 'undefined'
          ? (variant.product as any)._id
          : (variant.product as unknown as string);

      item = await this.itemRepo.create({
        cart: cart.id,
        product: productIdValue,
        variant: variant.id,
        quantity,
        unitPrice,
        subtotal: unitPrice * quantity,
      });

      await this.recalculateTotals(cart.id);
    }

    emitToUser(userId, 'cart:updated', { action: 'ADD', item });
    return item;
  }

  public async updateCartItem(itemId: string, quantity: number) {
    if (quantity < 1) throw new Error('Quantity must be at least 1');
    const item = await this.itemRepo.findById(itemId);
    if (!item) throw new Error('Cart item not found');

    const variant = await ProductVariantModel.findById(item.variant).exec();
    if (!variant) throw new Error('Product variant not found');

    const unitPrice = variant.discountPrice ?? variant.price;
    const updated = await this.itemRepo.update(itemId, { quantity, subtotal: unitPrice * quantity });
    const cart = await this.cartRepo.findById(item.cart.toString());
    await this.recalculateTotals(item.cart.toString());

    if (cart?.user) {
      emitToUser(cart.user.toString(), 'cart:updated', { action: 'UPDATE', item: updated });
    }
    return updated;
  }

  public async removeCartItem(itemId: string) {
    const item = await this.itemRepo.findById(itemId);
    if (!item) return null;
    const cart = await this.cartRepo.findById(item.cart.toString());
    await this.itemRepo.delete(itemId);
    await this.recalculateTotals(item.cart.toString());

    if (cart?.user) {
      emitToUser(cart.user.toString(), 'cart:updated', { action: 'REMOVE', itemId });
    }
    return item;
  }

  public async clearCart(userId: string) {
    const cart = await this.cartRepo.findByUser(userId);
    if (!cart) return null;
    const items = await this.itemRepo.findByCart(cart.id);
    await Promise.all(items.map((i) => this.itemRepo.delete(i.id)));
    await this.cartRepo.clearCart(cart.id);

    emitToUser(userId, 'cart:updated', { action: 'CLEAR' });
    return cart;
  }

  public calculateBilling(items: any[], discountAmount: number = 0, shippingFee: number = 0): ICartBillingBreakup {
    const subtotal = items.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxRate = 18; // 18% Standard GST
    const taxAmount = Math.round(taxableAmount * 0.18 * 100) / 100;
    const cgst = Math.round((taxAmount / 2) * 100) / 100; // 9% Central GST
    const sgst = Math.round((taxAmount / 2) * 100) / 100; // 9% State GST
    const totalAmount = Math.round((taxableAmount + taxAmount + shippingFee) * 100) / 100;

    return {
      subtotal,
      discountAmount,
      taxableAmount,
      taxRate,
      taxAmount,
      cgst,
      sgst,
      shippingFee,
      totalAmount,
    };
  }

  private async recalculateTotals(cartId: string) {
    const items = await this.itemRepo.findByCart(cartId);
    const cart = await this.cartRepo.findById(cartId);

    const totalItems = items.length;
    const totalQuantity = items.reduce((s, it) => s + it.quantity, 0);
    const discountAmount = cart?.discountAmount || 0;
    const shippingFee = cart?.shippingFee || 0;

    const billing = this.calculateBilling(items, discountAmount, shippingFee);

    await this.cartRepo.updateTotals(cartId, {
      totalItems,
      totalQuantity,
      subtotal: billing.subtotal,
      taxRate: billing.taxRate,
      taxAmount: billing.taxAmount,
      cgst: billing.cgst,
      sgst: billing.sgst,
      shippingFee: billing.shippingFee,
      discountAmount: billing.discountAmount,
      totalAmount: billing.totalAmount,
    });
  }
}
