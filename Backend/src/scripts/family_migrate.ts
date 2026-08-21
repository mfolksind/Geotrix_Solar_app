import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load env vars
dotenv.config({ path: path.resolve(__dirname, ".env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/geotrix?directConnection=true";

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        const db = mongoose.connection.db;
        if (!db) throw new Error("Database connection not established");

        // View data first
        const products = await db.collection("products").find({}).toArray();
        console.log(`Found ${products.length} products in the database.`);

        const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];
        console.log(`Unique brands found in products: ${brands.join(", ")}`);

        // Create families
        const familiesCollection = db.collection("families");
        const familyMap: Record<string, mongoose.Types.ObjectId> = {};

        for (const brand of ["Geotrix", "Thermox", ...brands]) {
            if (!brand) continue;

            let family = await familiesCollection.findOne({ name: brand });
            const slug = brand.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            if (!family) {
                console.log(`Creating Family: ${brand}`);
                const result = await familiesCollection.insertOne({
                    name: brand,
                    slug,
                    description: `Automatically created family for ${brand}`,
                    requiresAdminApproval: brand === "Geotrix" ? false : true,
                    status: "ACTIVE",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                familyMap[brand] = result.insertedId;
            } else {
                if (!family.slug) {
                    console.log(`Updating missing slug for Family: ${brand}`);
                    await familiesCollection.updateOne({ _id: family._id }, { $set: { slug } });
                }
                familyMap[brand] = family._id;
            }
        }

        console.log("Family Map:", familyMap);

        // Update products
        let updatedCount = 0;
        for (const product of products) {
            if (product.brand && !product.family) {
                const familyId = familyMap[product.brand];
                if (familyId) {
                    await db.collection("products").updateOne(
                        { _id: product._id },
                        {
                            $set: { family: familyId },
                            $unset: { brand: "" },
                        },
                    );
                    updatedCount++;
                }
            } else if (!product.family) {
                // Fallback for products with no brand
                const defaultFamilyId = familyMap["Geotrix"];
                if (defaultFamilyId) {
                    await db.collection("products").updateOne({ _id: product._id }, { $set: { family: defaultFamilyId } });
                    updatedCount++;
                }
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} products.`);
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
