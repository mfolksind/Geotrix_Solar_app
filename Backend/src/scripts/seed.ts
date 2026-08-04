import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import CategoryModel from '../modules/categories/category.model';
import ProductModel from '../modules/products/product.model';
import ProductVariantModel from '../modules/products/productVariant.model';
import ProductImageModel from '../modules/products/productImage.model';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mfolks_geotrix';

const unsplashImages = [
  'https://images.unsplash.com/photo-1542382103-605fb7058be3?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1581092334651-ddf26d9a09d0?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1565507158750-98be128f7eeb?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1579298245158-33e8f568f7d3?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&q=80&w=600'
];

function getRandomImage() {
  return unsplashImages[Math.floor(Math.random() * unsplashImages.length)];
}

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB...', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    console.log('Dropping existing collections to reset indexes...');
    try { await mongoose.connection.db?.dropCollection('categories'); } catch (e) {}
    try { await mongoose.connection.db?.dropCollection('products'); } catch (e) {}
    try { await mongoose.connection.db?.dropCollection('productvariants'); } catch (e) {}
    try { await mongoose.connection.db?.dropCollection('productimages'); } catch (e) {}

    console.log('Creating Categories...');
    const catRods = await CategoryModel.create({
      name: 'Copper Bonded Rods',
      slug: 'copper-bonded-rods',
      description: 'High quality copper bonded earth rods.',
      status: 'ACTIVE'
    });

    const catStrips = await CategoryModel.create({
      name: 'GI Strips',
      slug: 'gi-strips',
      description: 'Galvanized iron earthing strips.',
      status: 'ACTIVE'
    });

    const catLightning = await CategoryModel.create({
      name: 'Lightning Arresters',
      slug: 'lightning-arresters',
      description: 'Advanced lightning protection systems.',
      status: 'ACTIVE'
    });

    const categories = [catRods, catStrips, catLightning];

    console.log('Creating Products & Variants...');

    // We will create 15 product families to have a lot of data
    for (let i = 1; i <= 15; i++) {
      const cat = categories[i % categories.length];
      
      const productName = `${cat.name.replace('s', '')} Series 00${i}`;
      const product = await ProductModel.create({
        name: productName,
        slug: `series-00${i}-${Date.now()}`,
        status: 'ACTIVE'
      });

      // Create 2 variants per product
      const variant1 = await ProductVariantModel.create({
        product: product._id,
        variantName: 'Standard Duty',
        slug: `standard-duty-00${i}-${Date.now()}`, // Ensure unique slug
        description: `Standard duty variant of ${product.name}. Perfect for residential use.`,
        category: cat._id,
        isDefault: true,
        sku: `STD-${i}A`,
        price: 1500 + (i * 100),
        discountPrice: 1200 + (i * 100),
        stock: 50,
        status: 'ACTIVE'
      });

      await ProductImageModel.create({
        variant: variant1._id,
        url: getRandomImage(),
        isPrimary: true
      });

      const variant2 = await ProductVariantModel.create({
        product: product._id,
        variantName: 'Heavy Duty',
        slug: `heavy-duty-00${i}-${Date.now()}`,
        description: `Heavy duty variant of ${product.name}. Perfect for industrial use.`,
        category: cat._id,
        isDefault: false,
        sku: `HD-${i}B`,
        price: 2500 + (i * 150),
        stock: 20,
        status: 'ACTIVE'
      });

      await ProductImageModel.create({
        variant: variant2._id,
        url: getRandomImage(),
        isPrimary: true
      });
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
