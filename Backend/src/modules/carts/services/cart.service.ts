import { CartRepository } from '../repositories/cart.repository';
import { CartItemRepository } from '../repositories/cartItem.repository';
import ProductVariantModel from '../../products/productVariant.model';
import ProductModel from '../../products/product.model';

export class CartService {
  constructor(private readonly cartRepo: CartRepository, private readonly itemRepo: CartItemRepository) {}

  public async getCart(userId: string) {
    let cart = await this.cartRepo.findByUser(userId);
    if (!cart) cart = await this.cartRepo.create(userId);

    const items = await this.itemRepo.findByCart(cart.id);
    return { cart, items };
  }

  public async addToCart(userId: string, productId: string, quantity: number, variantId?: string) {
    // ensure cart exists
    let cart = await this.cartRepo.findByUser(userId);
    if (!cart) cart = await this.cartRepo.create(userId);

    // resolve variant: prefer explicit variantId, otherwise find an ACTIVE variant
    let variant;
    if (variantId) {
      variant = await ProductVariantModel.findById(variantId).exec();
    } else {
      variant = await ProductVariantModel.findOne({ product: productId, status: 'ACTIVE' }).exec();
      if (!variant) {
        const product = await ProductModel.findById(productId).exec();
        if (!product) throw new Error('Product not found');
        if (!product.price || product.price <= 0) throw new Error('Product price is required to add this product to cart');

        variant = await ProductVariantModel.create({
          product: productId,
          variantName: 'Default',
          price: product.price,
          discountPrice: product.discountPrice,
          stock: 0,
          status: 'ACTIVE',
        });
      }
    }
    if (!variant) throw new Error('Product variant not found');

    // check if item exists
    const existing = await this.itemRepo.findByVariant(cart.id, variant.id);
    if (existing) {
      const newQty = existing.quantity + quantity;
      const unitPrice = variant.discountPrice ?? variant.price;
      const updated = await this.itemRepo.update(existing.id, { quantity: newQty, subtotal: unitPrice * newQty });
      await this.recalculateTotals(cart.id);
      return updated;
    }

    const unitPrice = variant.discountPrice ?? variant.price;
    const productIdValue = (variant.product as unknown) && typeof (variant.product as any)._id !== 'undefined' ? (variant.product as any)._id : (variant.product as unknown as string);
    const item = await this.itemRepo.create({ cart: cart.id, product: productIdValue, variant: variant.id, quantity, unitPrice, subtotal: unitPrice * quantity });
    await this.recalculateTotals(cart.id);
    return item;
  }

  public async updateCartItem(itemId: string, quantity: number) {
    if (quantity < 1) throw new Error('Quantity must be at least 1');
    const item = await this.itemRepo.findById(itemId);
    if (!item) throw new Error('Cart item not found');

    // resolve variant
    const variant = await ProductVariantModel.findById(item.variant).exec();
    if (!variant) throw new Error('Product variant not found');

    const unitPrice = variant.discountPrice ?? variant.price;
    const updated = await this.itemRepo.update(itemId, { quantity, subtotal: unitPrice * quantity });
    await this.recalculateTotals(item.cart.toString());
    return updated;
  }

  public async removeCartItem(itemId: string) {
    const item = await this.itemRepo.findById(itemId);
    if (!item) return null;
    await this.itemRepo.delete(itemId);
    await this.recalculateTotals(item.cart.toString());
    return item;
  }

  public async clearCart(userId: string) {
    const cart = await this.cartRepo.findByUser(userId);
    if (!cart) return null;
    // remove items
    const items = await this.itemRepo.findByCart(cart.id);
    await Promise.all(items.map((i) => this.itemRepo.delete(i.id)));
    await this.cartRepo.clearCart(cart.id);
    return cart;
  }

  private async recalculateTotals(cartId: string) {
    const items = await this.itemRepo.findByCart(cartId);
    const totalItems = items.length;
    const totalQuantity = items.reduce((s, it) => s + it.quantity, 0);
    const totalAmount = items.reduce((s, it) => s + it.subtotal, 0);
    await this.cartRepo.updateTotals(cartId, { totalItems, totalQuantity, totalAmount });
  }
}
