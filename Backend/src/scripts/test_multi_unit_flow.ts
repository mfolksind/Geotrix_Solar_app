import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import UserModel from '../modules/users/user.model';
import AddressModel from '../modules/addresses/models/address.model';
import ProductModel from '../modules/products/product.model';
import ProductVariantModel from '../modules/products/productVariant.model';
import CartModel from '../modules/carts/models/cart.model';
import CartItemModel from '../modules/carts/models/cartItem.model';
import OrderModel from '../modules/orders/models/order.model';
import OrderItemModel from '../modules/orders/models/orderItem.model';
import { CartRepository } from '../modules/carts/repositories/cart.repository';
import { CartItemRepository } from '../modules/carts/repositories/cartItem.repository';
import { CartService } from '../modules/carts/services/cart.service';
import { OrderRepository } from '../modules/orders/repositories/order.repository';
import { OrderItemRepository } from '../modules/orders/repositories/orderItem.repository';
import { OrderService } from '../modules/orders/services/order.service';

async function runMultiUnitTest() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/mfolksgeo';
  console.log('Connecting to MongoDB at:', uri);
  await mongoose.connect(uri);

  try {
    console.log('--- Multi-Unit Flow Test Starting ---');

    // 1. Get or create test user
    let user = await UserModel.findOne({ email: 'unit_test_user@mfolks.com' });
    if (!user) {
      user = await UserModel.create({
        name: 'Unit Test Customer',
        email: 'unit_test_user@mfolks.com',
        phone: '9876543219',
        role: 'customer',
        status: 'active',
        isVerified: true,
      });
    }
    const userId = String(user._id);

    // Create shipping address
    let address = await AddressModel.findOne({ user: user._id });
    if (!address) {
      address = await AddressModel.create({
        user: user._id,
        fullName: 'Unit Test Customer',
        phone: '9876543219',
        addressLine1: 'Test Industrial Area',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
      });
    }

    // 2. Create test product & multi-unit variant
    const product = await ProductModel.create({
      name: 'Multi-Unit Copper Wire Test Product',
      slug: `multi-unit-copper-wire-${Date.now()}`,
      status: 'ACTIVE',
      description: 'Copper wire sold in KG or Meter or Pieces',
    });

    const variant = await ProductVariantModel.create({
      product: product._id,
      variantName: '1.5 sq mm High Grade Wire',
      sku: `WIRE-15-${Date.now()}`,
      slug: `wire-15-${Date.now()}`,
      price: 100, // base price (pcs)
      discountPrice: 90,
      stock: 500,
      unit: 'pcs',
      availableUnits: ['pcs', 'kg', 'meter'],
      unitPrices: [
        { unit: 'kg', price: 600, discountPrice: 550, isDefault: false },
        { unit: 'meter', price: 45, discountPrice: 40, isDefault: false },
      ],
      status: 'ACTIVE',
      isDefault: true,
    });

    console.log('✓ Created Test Product and Multi-Unit Variant:', {
      productId: String(product._id),
      variantId: String(variant._id),
      availableUnits: variant.availableUnits,
      unitPrices: variant.unitPrices,
    });

    // 3. Clear any existing cart for user
    const existingCarts = await CartModel.find({ userId });
    if (existingCarts.length > 0) {
      const cartIds = existingCarts.map((c: any) => c._id);
      await CartItemModel.deleteMany({ cartId: { $in: cartIds } });
      await CartModel.deleteMany({ userId });
    }

    const cartRepo = new CartRepository();
    const cartItemRepo = new CartItemRepository();
    const cartService = new CartService(cartRepo, cartItemRepo);

    const orderRepo = new OrderRepository();
    const orderItemRepo = new OrderItemRepository();
    const orderService = new OrderService(orderRepo, orderItemRepo, cartRepo, cartItemRepo);

    // 4. Add to cart with unit 'kg' (quantity 2 -> 2 * 550 = 1100)
    console.log('\nAdding 2 KG of wire to cart...');
    const cartItemKg = await cartService.addToCart(
      userId,
      String(product._id),
      2,
      String(variant._id),
      'kg'
    );
    console.log('✓ Added KG Cart Item:', {
      id: cartItemKg?._id,
      unit: cartItemKg?.unit,
      quantity: cartItemKg?.quantity,
      subtotal: cartItemKg?.subtotal,
    });

    // 5. Add to cart with unit 'meter' (quantity 10 -> 10 * 40 = 400)
    console.log('\nAdding 10 METERS of wire to cart...');
    const cartItemMeter = await cartService.addToCart(
      userId,
      String(product._id),
      10,
      String(variant._id),
      'meter'
    );
    console.log('✓ Added Meter Cart Item:', {
      id: cartItemMeter?._id,
      unit: cartItemMeter?.unit,
      quantity: cartItemMeter?.quantity,
      subtotal: cartItemMeter?.subtotal,
    });

    // 6. Get Cart to verify items and billing
    const cartData = await cartService.getCart(userId);
    console.log('✓ Cart Items retrieved:');
    cartData.items.forEach((i: any) => {
      console.log(`  - Variant: ${i.variant?.variantName || i.variantId}, Unit: ${i.unit}, Qty: ${i.quantity}, Price: ₹${i.price}, Subtotal: ₹${i.subtotal}`);
    });
    console.log('✓ Cart Billing:', cartData.billing);

    if (cartData.items.length !== 2) {
      throw new Error(`Expected 2 distinct cart items for different units, found: ${cartData.items.length}`);
    }

    if (cartData.billing.subtotal !== 1500) { // 1100 + 400 = 1500
      throw new Error(`Expected subtotal 1500 (1100 + 400), got: ${cartData.billing.subtotal}`);
    }

    // 7. Create Order from Cart items
    console.log('\nCreating Order with Multi-Unit items...');
    const order = await orderService.createOrder(
      userId,
      String(address._id),
      [
        { variantId: String(variant._id), quantity: 2, unit: 'kg' },
        { variantId: String(variant._id), quantity: 10, unit: 'meter' },
      ],
      'Test multi-unit wire order'
    );

    console.log('✓ Order Created successfully:', {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      totalAmount: order.totalAmount,
    });

    // 8. Verify Order Items in DB
    const orderItems = await OrderItemModel.find({ order: order._id });
    console.log('✓ Verified Order Items stored in DB:');
    orderItems.forEach((item: any) => {
      console.log(`  - ${item.productName} (${item.variantName}) -> ${item.quantity} ${item.unit} @ ₹${item.unitPrice} = ₹${item.subtotal}`);
    });

    if (orderItems.length !== 2) {
      throw new Error(`Expected 2 order items, got: ${orderItems.length}`);
    }

    const kgItem = orderItems.find((i: any) => i.unit === 'kg');
    const meterItem = orderItems.find((i: any) => i.unit === 'meter');

    if (!kgItem || kgItem.quantity !== 2 || kgItem.unitPrice !== 550 || kgItem.subtotal !== 1100) {
      throw new Error(`KG OrderItem verification failed: ${JSON.stringify(kgItem)}`);
    }
    if (!meterItem || meterItem.quantity !== 10 || meterItem.unitPrice !== 40 || meterItem.subtotal !== 400) {
      throw new Error(`Meter OrderItem verification failed: ${JSON.stringify(meterItem)}`);
    }

    console.log('\n======================================================');
    console.log('🎉 ALL MULTI-UNIT FLOW TESTS PASSED WITH 100% SUCCESS!');
    console.log('======================================================');

    // Cleanup test records
    await OrderItemModel.deleteMany({ order: order._id });
    await OrderModel.findByIdAndDelete(order._id);
    await CartItemModel.deleteMany({ _id: { $in: [cartItemKg?._id, cartItemMeter?._id] } });
    await ProductVariantModel.findByIdAndDelete(variant._id);
    await ProductModel.findByIdAndDelete(product._id);
    console.log('Cleaned up test product, variant, cart and order records.');

  } catch (error) {
    console.error('Multi-Unit Test Failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected MongoDB');
  }
}

runMultiUnitTest();
