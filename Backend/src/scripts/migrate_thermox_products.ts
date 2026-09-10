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

const WP_URL = process.env.THERMOX_WORDPRESS_URL || "https://thermox.mfolks.com/graphql";

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

const ALL_PRODUCTS_PAGINATED_QUERY = `
  query GetAllProducts($after: String) {
    products(first: 100, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        title
        slug
        content
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
            variantWeight
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

async function uploadUrlToCloudinary(url: string, folder = "thermox_products"): Promise<string> {
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

function buildFullDescription(content?: string, shortDesc?: string, specs?: Array<{ specName?: string; specValue?: string; specUnit?: string }>): string {
    let description = (content || shortDesc || "").trim();
    if (specs && specs.length > 0) {
        const validSpecs = specs.filter((s) => s.specName && s.specValue);
        if (validSpecs.length > 0) {
            const specRows = validSpecs
                .map((s) => `<tr><th style="text-align:left;padding:4px 8px;border:1px solid #ddd;">${s.specName}</th><td style="padding:4px 8px;border:1px solid #ddd;">${s.specValue}${s.specUnit ? " " + s.specUnit : ""}</td></tr>`)
                .join("");
            description += `\n<table class="technical-specs" style="width:100%;border-collapse:collapse;margin-top:12px;"><tbody>${specRows}</tbody></table>`;
        }
    }
    return description;
}

async function fetchAllProducts() {
    let hasNextPage = true;
    let after: string | null = null;
    const allProducts: any[] = [];

    while (hasNextPage) {
        const data = await fetchFromWP(ALL_PRODUCTS_PAGINATED_QUERY, { after });
        const nodes = data?.products?.nodes || [];
        allProducts.push(...nodes);
        hasNextPage = data?.products?.pageInfo?.hasNextPage || false;
        after = data?.products?.pageInfo?.endCursor || null;
    }

    return allProducts;
}

async function migrate() {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/geotrix?directConnection=true";
    console.log("Connecting to MongoDB:", mongoUri);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully.");

    console.log("Locating or creating Thermox Family...");
    let thermoxFamily = await FamilyModel.findOne({ slug: "thermox" });
    if (!thermoxFamily) {
        thermoxFamily = await FamilyModel.create({
            name: "Thermox",
            slug: "thermox",
            description: "Thermox thermal spray powders, wires, equipment, and industrial coatings family",
            status: "ACTIVE",
            requiresAdminApproval: true,
        });
        console.log("Created Thermox Family (id: " + thermoxFamily._id + ")");
    } else {
        console.log("Found existing Thermox Family (id: " + thermoxFamily._id + ")");
    }

    console.log("Cleaning existing Thermox products, variants, and images...");
    const existingThermoxProducts = await ProductModel.find({ family: thermoxFamily._id });
    const existingProductIds = existingThermoxProducts.map((p) => p._id);

    if (existingProductIds.length > 0) {
        const existingVariants = await ProductVariantModel.find({ product: { $in: existingProductIds } });
        const existingVariantIds = existingVariants.map((v) => v._id);

        await ProductImageModel.deleteMany({ variant: { $in: existingVariantIds } });
        await ProductVariantModel.deleteMany({ product: { $in: existingProductIds } });
        await ProductModel.deleteMany({ family: thermoxFamily._id });
        console.log(`Removed ${existingProductIds.length} existing Thermox products and their variants/images.`);
    }

    console.log("Fetching Categories from Thermox WordPress...");
    const catData = await fetchFromWP(ALL_CATEGORIES_QUERY);
    const categories = catData.productCategories.nodes;

    const categoryMap = new Map<string, mongoose.Types.ObjectId>();
    for (const cat of categories) {
        if (!categoryMap.has(cat.slug)) {
            let category = await CategoryModel.findOne({ slug: cat.slug });
            if (!category) {
                category = await CategoryModel.create({
                    name: cat.name,
                    slug: cat.slug,
                    status: "ACTIVE",
                    family: thermoxFamily._id,
                });
                console.log(`Created Category: ${cat.name} (${cat.slug})`);
            } else {
                console.log(`Reusing existing Category: ${cat.name} (${cat.slug})`);
            }
            categoryMap.set(cat.slug, category._id as mongoose.Types.ObjectId);
        }
    }

    console.log("Fetching All Products from Thermox WordPress...");
    const products = await fetchAllProducts();
    console.log(`Fetched ${products.length} products from Thermox.`);

    let totalProducts = 0;
    let totalVariants = 0;

    // PASS 1: Create all products and variants, collect relation slugs
    const relationMap = new Map<string, { related: string[]; compatible: string[]; recommended: string[] }>();
    const variantSlugMap = new Map<string, string>(); // wpSlug -> default variant ObjectId string

    for (const wpProduct of products) {
        // 1. Determine Category
        let categoryId: mongoose.Types.ObjectId | null = null;
        if (wpProduct.productCategories?.nodes?.length > 0) {
            const wpCatSlug = wpProduct.productCategories.nodes[0].slug;
            categoryId = categoryMap.get(wpCatSlug) || null;
        }

        // 2. Create Base Product
        const product = await ProductModel.create({
            name: wpProduct.title,
            family: thermoxFamily._id,
            category: categoryId,
            status: "ACTIVE",
        });
        totalProducts++;

        const originalThumbnail = wpProduct.featuredImage?.node?.sourceUrl || "";
        const shortDesc = wpProduct.productData?.shortDescription || "";
        const fullDesc = buildFullDescription(wpProduct.content, shortDesc, wpProduct.productData?.technicalSpecs);

        let thumbnail = originalThumbnail;
        if (originalThumbnail) {
            console.log(`Uploading thumbnail for "${wpProduct.title}"...`);
            thumbnail = await uploadUrlToCloudinary(originalThumbnail, "thermox_products");
        }

        // 3. Handle Variants
        const wpVariants = wpProduct.productData?.productVariants;

        if (wpVariants && wpVariants.length > 0) {
            for (let i = 0; i < wpVariants.length; i++) {
                const wpVariant = wpVariants[i];

                let price = 0;
                if (wpVariant.variantPrice) {
                    price = parseFloat(String(wpVariant.variantPrice).replace(/[^0-9.]/g, "")) || 0;
                }

                let weight: number | undefined = undefined;
                if (wpVariant.variantWeight) {
                    const parsedWeight = parseFloat(String(wpVariant.variantWeight).replace(/[^0-9.]/g, ""));
                    if (!isNaN(parsedWeight)) weight = parsedWeight;
                }

                const unit = wpVariant.variantPriceUnit || (wpVariant.variantWeight ? String(wpVariant.variantWeight).replace(/[0-9.\s]/g, "") : "");

                let stock = 100;
                if (wpVariant.availability) {
                    if (Array.isArray(wpVariant.availability)) {
                        stock = wpVariant.availability.length > 0 && !wpVariant.availability.includes("out_of_stock") ? 100 : 0;
                    } else if (typeof wpVariant.availability === "string") {
                        stock = wpVariant.availability.toLowerCase().includes("out") ? 0 : 100;
                    }
                }

                const variantSlug = wpVariants.length > 1 ? `${wpProduct.slug}-${i + 1}` : wpProduct.slug;

                const variant = await ProductVariantModel.create({
                    product: product._id,
                    variantName: wpVariant.variantLabel || (wpVariants.length > 1 ? `${wpProduct.title} - Variant ${i + 1}` : wpProduct.title),
                    slug: variantSlug,
                    description: fullDesc,
                    shortDescription: shortDesc,
                    thumbnail: thumbnail,
                    isDefault: i === 0,
                    sku: wpVariant.variantSku || "",
                    price: price,
                    weight: weight,
                    unit: unit || undefined,
                    stock: stock,
                    status: "ACTIVE",
                });

                if (thumbnail) {
                    await ProductImageModel.create({
                        variant: variant._id,
                        url: thumbnail,
                        isPrimary: true,
                        sortOrder: 0,
                    });
                }

                if (i === 0) {
                    variantSlugMap.set(wpProduct.slug, variant._id.toString());
                }

                relationMap.set(variant._id.toString(), {
                    related: wpProduct.productData?.relatedSystems?.nodes?.map((n: any) => n.slug) || [],
                    compatible: wpProduct.productData?.compatibleProducts?.nodes?.map((n: any) => n.slug) || [],
                    recommended: wpProduct.productData?.recommendedProducts?.nodes?.map((n: any) => n.slug) || [],
                });

                totalVariants++;
            }
        } else {
            // Single default variant
            const variant = await ProductVariantModel.create({
                product: product._id,
                variantName: wpProduct.title,
                slug: wpProduct.slug,
                description: fullDesc,
                shortDescription: shortDesc,
                thumbnail: thumbnail,
                isDefault: true,
                price: 0,
                stock: 100,
                status: "ACTIVE",
            });

            if (thumbnail) {
                await ProductImageModel.create({
                    variant: variant._id,
                    url: thumbnail,
                    isPrimary: true,
                    sortOrder: 0,
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

        console.log(`Processed Product: ${wpProduct.title} (${wpVariants?.length || 1} variant(s))`);
    }

    console.log("\nStarting PASS 2: Linking Relations between Variants...");
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

    console.log("\n==========================================");
    console.log("=== THERMOX MIGRATION COMPLETE ===");
    console.log("==========================================");
    console.log(`Categories mapped: ${categoryMap.size}`);
    console.log(`Products created: ${totalProducts}`);
    console.log(`Variants created: ${totalVariants}`);
    console.log(`Variants with relations linked: ${totalRelationsLinked}`);

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
}

migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});
