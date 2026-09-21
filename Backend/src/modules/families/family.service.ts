import FamilyModel from './family.model';
import CategoryModel from '../categories/category.model';
import ProductModel from '../products/product.model';
import { IFamilyDocument } from './family.interface';

export interface FamilyQueryParams {
    search?: string;
    status?: string;
    requiresAdminApproval?: boolean | string;
    sort?: string;
    page?: number | string;
    limit?: number | string;
}

export class FamilyService {
    public async createFamily(data: Partial<IFamilyDocument>) {
        if (!data.slug && data.name) {
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        return FamilyModel.create(data);
    }

    public async getStats() {
        const [totalFamilies, activeFamilies, totalCategories, totalProducts] = await Promise.all([
            FamilyModel.countDocuments({ isDeleted: false }),
            FamilyModel.countDocuments({ isDeleted: false, status: 'ACTIVE' }),
            CategoryModel.countDocuments({ isDeleted: false, family: { $ne: null } }),
            ProductModel.countDocuments({ isDeleted: false, family: { $ne: null } }),
        ]);

        return {
            totalFamilies,
            activeFamilies,
            totalCategories,
            totalProducts,
        };
    }

    public async getAllFamilies(query: FamilyQueryParams = {}) {
        const filter: Record<string, any> = { isDeleted: false };

        if (query.search && query.search.trim()) {
            const regex = new RegExp(query.search.trim(), 'i');
            filter.$or = [
                { name: { $regex: regex } },
                { slug: { $regex: regex } },
                { description: { $regex: regex } },
            ];
        }

        if (query.status && query.status !== 'ALL') {
            filter.status = query.status.toUpperCase();
        }

        if (query.requiresAdminApproval !== undefined && query.requiresAdminApproval !== '' && query.requiresAdminApproval !== 'ALL') {
            filter.requiresAdminApproval = String(query.requiresAdminApproval) === 'true';
        }

        let sortOption: Record<string, 1 | -1> = { createdAt: -1 };
        if (query.sort) {
            switch (query.sort) {
                case 'name_asc':
                    sortOption = { name: 1 };
                    break;
                case 'name_desc':
                    sortOption = { name: -1 };
                    break;
                case 'oldest':
                    sortOption = { createdAt: 1 };
                    break;
                case 'newest':
                default:
                    sortOption = { createdAt: -1 };
                    break;
            }
        }

        const page = Math.max(1, parseInt(String(query.page || 1), 10) || 1);
        const hasLimit = query.limit !== undefined && query.limit !== '0' && query.limit !== 0;
        const limit = hasLimit ? Math.max(1, parseInt(String(query.limit), 10) || 50) : 0;

        let findQuery = FamilyModel.find(filter).sort(sortOption);
        if (limit > 0) {
            findQuery = findQuery.skip((page - 1) * limit).limit(limit);
        }

        const [families, total] = await Promise.all([
            findQuery.lean(),
            FamilyModel.countDocuments(filter),
        ]);

        const familyIds = families.map(f => f._id);

        const [categoriesPerFamily, productsPerFamily] = await Promise.all([
            CategoryModel.aggregate([
                { $match: { family: { $in: familyIds }, isDeleted: false } },
                { $group: { _id: '$family', count: { $sum: 1 }, names: { $push: '$name' } } }
            ]),
            ProductModel.aggregate([
                { $match: { family: { $in: familyIds }, isDeleted: false } },
                { $group: { _id: '$family', count: { $sum: 1 } } }
            ])
        ]);

        const categoryMap = new Map<string, { count: number; names: string[] }>();
        categoriesPerFamily.forEach(item => {
            if (item._id) categoryMap.set(item._id.toString(), { count: item.count, names: item.names.slice(0, 5) });
        });

        const productMap = new Map<string, number>();
        productsPerFamily.forEach(item => {
            if (item._id) productMap.set(item._id.toString(), item.count);
        });

        const enrichedFamilies = families.map(family => {
            const famIdStr = family._id.toString();
            const catInfo = categoryMap.get(famIdStr) || { count: 0, names: [] };
            const prodCount = productMap.get(famIdStr) || 0;
            return {
                ...family,
                categoriesCount: catInfo.count,
                categoriesPreview: catInfo.names,
                productsCount: prodCount,
            };
        });

        if (query.sort === 'products_desc') {
            enrichedFamilies.sort((a, b) => b.productsCount - a.productsCount);
        } else if (query.sort === 'categories_desc') {
            enrichedFamilies.sort((a, b) => b.categoriesCount - a.categoriesCount);
        }

        return {
            families: enrichedFamilies,
            pagination: {
                total,
                page,
                limit: limit || total,
                totalPages: limit > 0 ? Math.ceil(total / limit) : 1,
            },
        };
    }

    public async getFamilyById(id: string) {
        return FamilyModel.findOne({ _id: id, isDeleted: false });
    }

    public async getFamilyLinkedItems(id: string) {
        const [categories, products] = await Promise.all([
            CategoryModel.find({ family: id, isDeleted: false }).select('name slug image status sortOrder').lean(),
            ProductModel.find({ family: id, isDeleted: false }).select('name status category createdAt').populate('category', 'name slug').lean(),
        ]);

        return {
            categories,
            products,
        };
    }

    public async updateFamily(id: string, data: Partial<IFamilyDocument>) {
        if (data.name && !data.slug) {
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        return FamilyModel.findByIdAndUpdate(id, data, { new: true });
    }

    public async deleteFamily(id: string) {
        return FamilyModel.findByIdAndUpdate(id, { isDeleted: true, status: 'INACTIVE' }, { new: true });
    }
}

