import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { env } from "./src/config/env";

import FamilyModel from "./src/modules/families/family.model";

async function run() {
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected");
  
  await FamilyModel.updateMany({ name: "Geotrix" }, { $set: { slug: "geotrix" } });
  const f = await FamilyModel.findOne({ name: "Geotrix" });
  console.log("Geotrix Family now has slug:", f?.slug);

  process.exit(0);
}
run();
