import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { env } from "./src/config/env";

import FamilyModel from "./src/modules/families/family.model";
import ProductModel from "./src/modules/products/product.model";
import ProductVariantModel from "./src/modules/products/productVariant.model";

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected");
  
  const families = await FamilyModel.find();
  console.log("Families:", families.map(f => ({ slug: f.slug, id: f._id })));
  
  const products = await ProductModel.find().populate("family", "slug");
  console.log("Products Count:", products.length);
  
  for (const p of products) {
    if ((p.family as any)?.slug !== 'geotrix') {
        console.log("NON-GEOTRIX Product:", p.name, "Family:", (p.family as any)?.slug);
    }
  }

  process.exit(0);
}
run();
