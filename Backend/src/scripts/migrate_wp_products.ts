import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env file in server/backend
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import CategoryModel from "../modules/categories/category.model";
import FamilyModel from "../modules/families/family.model";
import ProductModel from "../modules/products/product.model";
import ProductVariantModel from "../modules/products/productVariant.model";
import ProductImageModel from "../modules/products/productImage.model";
import { uploadImage } from "../common/services/cloudinary";

const WP_URL = process.env.PUBLIC_WORDPRESS_URL || "https://geotrix.mfolks.com/graphql";

const ALL_PRODUCTS_QUERY = `
  query GetAllProducts {
    products(first: 100) {
      nodes {
        id
        title
        slug
        featuredImage {
          node {
            sourceUrl
            altText
          }
        }
        productCategories {
          nodes {
            name
            slug
          }
        }
        productData {
          relatedSystems {
            nodes {
              slug
            }
          }
          compatibleProducts {
            nodes {
              slug
            }
          }
          recommendedProducts {
            nodes {
              slug
            }
          }
          shortDescription
          technicalSpecs {
            specName
            specValue
            specUnit
          }
          productVariants {
            variantLabel
            variantDiameter
            variantLength
            variantCoating
            variantSku
            variantPriceType
            variantPrice
            variantPriceUnit
            variantPriceLastUpdated
            availability
          }
        }
      }
    }
  }
`;

const ALL_CATEGORIES_QUERY = `
  query GetAllCategories {
    productCategories(first: 100) {
      nodes {
        name
        slug
      }
    }
  }
`;

async function fetchFromWP(query: string, variables = {}) {
    const res = await fetch(WP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables }),
    });
    if (!res.ok) throw new Error(`WP Fetch Error: ${res.statusText}`);
    const json: any = await res.json();
    if (json.errors) throw new Error(`WP GraphQL Error: ${JSON.stringify(json.errors)}`);
    return json.data;
}

async function uploadUrlToCloudinary(url: string, folder = "geotrix_products"): Promise<string> {
    if (!url) return "";
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Failed to fetch image from ${url}`);
        const buffer = await res.arrayBuffer();

        const file = {
            buffer: Buffer.from(buffer),
            originalname: url.split("/").pop() || "image.jpg",
            mimetype: res.headers.get("content-type") || "image/jpeg",
            size: buffer.byteLength,
            fieldname: "file",
            encoding: "7bit",
        } as Express.Multer.File;

        const uploadResult = await uploadImage(file, folder);
        return uploadResult.secure_url;
    } catch (error) {
        console.error(`Failed to upload image ${url} to Cloudinary:`, error);
        return url; // Fallback to original URL
    }
}

async function migrate() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/geotrix?directConnection=true";
    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.");

    console.log("WIPING EXISTING DATA...");
    await FamilyModel.deleteMany({});
    await CategoryModel.deleteMany({});
    await ProductModel.deleteMany({});
    await ProductVariantModel.deleteMany({});
    await ProductImageModel.deleteMany({});
    console.log("Existing products, families, and categories wiped.");

    console.log("Creating default Geotrix Family...");
    const geotrixFamily = await FamilyModel.create({
        name: "Geotrix",
        slug: "geotrix",
        status: "ACTIVE",
        requiresAdminApproval: false
    });

    console.log("Fetching Categories from WordPress...");
    const catData = await fetchFromWP(ALL_CATEGORIES_QUERY);
    const categories = catData.productCategories.nodes;

    const categoryMap = new Map();
    for (const cat of categories) {
        // Avoid duplicates
        if (!categoryMap.has(cat.slug)) {
            const newCat = await CategoryModel.create({
                name: cat.name,
                slug: cat.slug,
                status: "ACTIVE",
                family: geotrixFamily._id
            });
            categoryMap.set(cat.slug, newCat._id);
            console.log(`Created Category: ${cat.name}`);
        }
    }

    console.log("Fetching Products from WordPress...");
    const prodData = await fetchFromWP(ALL_PRODUCTS_QUERY);
    const products = prodData.products.nodes;

    let totalProducts = 0;
    let totalVariants = 0;

    // PASS 1: Create all products and store relation slugs
    const relationMap = new Map<string, { related: string[]; compatible: string[]; recommended: string[] }>();
    const variantSlugMap = new Map<string, string>(); // wpSlug -> variantObjectId

    for (const wpProduct of products) {
        // 2. Determine Category
        let categoryId = null;
        if (wpProduct.productCategories?.nodes?.length > 0) {
            const wpCatSlug = wpProduct.productCategories.nodes[0].slug;
            categoryId = categoryMap.get(wpCatSlug) || null;
        }

        // 1. Create Base Product
        const product = await ProductModel.create({
            name: wpProduct.title,
            family: geotrixFamily._id,
            category: categoryId,
            status: "ACTIVE",
        });
        totalProducts++;

        // 3. Handle Variants
        const wpVariants = wpProduct.productData?.productVariants;
        const originalThumbnail = wpProduct.featuredImage?.node?.sourceUrl || "";
        const shortDesc = wpProduct.productData?.shortDescription || "";

        let thumbnail = originalThumbnail;
        if (originalThumbnail) {
            console.log(`Uploading thumbnail for ${wpProduct.title}...`);
            thumbnail = await uploadUrlToCloudinary(originalThumbnail);
        }

        if (wpVariants && wpVariants.length > 0) {
            // Create multiple variants
            for (let i = 0; i < wpVariants.length; i++) {
                const wpVariant = wpVariants[i];

                // Clean price string to number if needed, WP might return string like "1500"
                let price = 0;
                if (wpVariant.variantPrice) {
                    price = parseFloat(String(wpVariant.variantPrice).replace(/[^0-9.]/g, "")) || 0;
                }

                const variant = await ProductVariantModel.create({
                    product: product._id,
                    variantName: wpVariant.variantLabel || `${wpProduct.title} - Variant ${i + 1}`,
                    slug: `${wpProduct.slug}-${i + 1}`,
                    shortDescription: shortDesc,
                    thumbnail: thumbnail,
                    isDefault: i === 0, // First is default
                    sku: wpVariant.variantSku || "",
                    price: price,
                    stock: wpVariant.availability === "In Stock" ? 100 : 0,
                    status: "ACTIVE",
                });

                if (thumbnail) {
                    await ProductImageModel.create({
                        variant: variant._id,
                        url: thumbnail,
                        isPrimary: true,
                    });
                }
                variantSlugMap.set(wpProduct.slug, variant._id.toString());
                relationMap.set(variant._id.toString(), {
                    related: wpProduct.productData?.relatedSystems?.nodes?.map((n: any) => n.slug) || [],
                    compatible: wpProduct.productData?.compatibleProducts?.nodes?.map((n: any) => n.slug) || [],
                    recommended: wpProduct.productData?.recommendedProducts?.nodes?.map((n: any) => n.slug) || [],
                });
                totalVariants++;
            }
        } else {
            // Create single default variant
            const variant = await ProductVariantModel.create({
                product: product._id,
                variantName: wpProduct.title,
                slug: wpProduct.slug,
                shortDescription: shortDesc,
                thumbnail: thumbnail,
                isDefault: true,
                price: 0, // Default to 0 if no price given at all
                stock: 100, // Default assumption
                status: "ACTIVE",
            });

            if (thumbnail) {
                await ProductImageModel.create({
                    variant: variant._id,
                    url: thumbnail,
                    isPrimary: true,
                });
            }

            variantSlugMap.set(wpProduct.slug, variant._id.toString());
            relationMap.set(variant._id.toString(), {
                related: wpProduct.productData?.relatedSystems?.nodes?.map((n: any) => n.slug) || [],
                compatible: wpProduct.productData?.compatibleProducts?.nodes?.map((n: any) => n.slug) || [],
                recommended: wpProduct.productData?.recommendedProducts?.nodes?.map((n: any) => n.slug) || [],
            });
            totalVariants++;
        }

        console.log(`Processed Product: ${wpProduct.title} (${wpVariants?.length || 1} variants)`);
    }

    console.log("\nStarting PASS 2: Linking Relations...");
    let totalRelationsLinked = 0;
    for (const [variantId, relations] of relationMap.entries()) {
        const getObjectIds = (slugs: string[]) => {
            return slugs.map((s) => variantSlugMap.get(s)).filter(Boolean);
        };

        const relatedIds = getObjectIds(relations.related);
        const compatibleIds = getObjectIds(relations.compatible);
        const recommendedIds = getObjectIds(relations.recommended);

        if (relatedIds.length > 0 || compatibleIds.length > 0 || recommendedIds.length > 0) {
            await ProductVariantModel.findByIdAndUpdate(variantId, {
                relatedSystems: relatedIds,
                compatibleProducts: compatibleIds,
                recommendedProducts: recommendedIds,
            });
            totalRelationsLinked++;
        }
    }

    console.log("\n--- MIGRATION COMPLETE ---");
    console.log(`Categories created: ${categoryMap.size}`);
    console.log(`Products created: ${totalProducts}`);
    console.log(`Variants created: ${totalVariants}`);
    console.log(`Products with relations linked: ${totalRelationsLinked}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
}

migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
