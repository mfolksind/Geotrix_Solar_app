import { Request, Response } from 'express';
import { FamilyService } from './family.service';
import asyncHandler from '../../common/utils/asyncHandler';

export class FamilyController {
    private familyService: FamilyService;

    constructor() {
        this.familyService = new FamilyService();
    }

    public createFamily = asyncHandler(async (req: Request, res: Response) => {
        const family = await this.familyService.createFamily(req.body);
        res.status(201).json({
            success: true,
            message: 'Family created successfully',
            data: family
        });
    });

    public getAllFamilies = asyncHandler(async (req: Request, res: Response) => {
        const families = await this.familyService.getAllFamilies();
        res.status(200).json({
            success: true,
            message: 'Families retrieved successfully',
            data: families
        });
    });

    public getFamilyById = asyncHandler(async (req: Request, res: Response) => {
        const family = await this.familyService.getFamilyById(req.params.id);
        if (!family) {
            return res.status(404).json({ success: false, message: 'Family not found' });
        }
        res.status(200).json({
            success: true,
            message: 'Family retrieved successfully',
            data: family
        });
    });

    public updateFamily = asyncHandler(async (req: Request, res: Response) => {
        const family = await this.familyService.updateFamily(req.params.id, req.body);
        if (!family) {
            return res.status(404).json({ success: false, message: 'Family not found' });
        }
        res.status(200).json({
            success: true,
            message: 'Family updated successfully',
            data: family
        });
    });

    public deleteFamily = asyncHandler(async (req: Request, res: Response) => {
        const family = await this.familyService.deleteFamily(req.params.id);
        if (!family) {
            return res.status(404).json({ success: false, message: 'Family not found' });
        }
        res.status(200).json({
            success: true,
            message: 'Family deleted successfully'
        });
    });
}
