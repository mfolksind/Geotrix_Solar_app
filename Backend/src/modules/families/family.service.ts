import FamilyModel from './family.model';
import { IFamilyDocument } from './family.interface';

export class FamilyService {
    public async createFamily(data: Partial<IFamilyDocument>) {
        // Generate slug if not provided
        if (!data.slug && data.name) {
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        const family = await FamilyModel.create(data);
        return family;
    }

    public async getAllFamilies() {
        return FamilyModel.find().sort({ createdAt: -1 });
    }

    public async getFamilyById(id: string) {
        return FamilyModel.findById(id);
    }

    public async updateFamily(id: string, data: Partial<IFamilyDocument>) {
        if (data.name && !data.slug) {
            data.slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        }
        return FamilyModel.findByIdAndUpdate(id, data, { new: true });
    }

    public async deleteFamily(id: string) {
        return FamilyModel.findByIdAndDelete(id);
    }
}
