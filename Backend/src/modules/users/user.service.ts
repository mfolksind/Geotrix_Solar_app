import { UserRepository } from './user.repository';
import { IUserDocument } from './user.interface';
import { UpdateProfilePayload, ChangeStatusPayload, UserQuery, ApproveFamilyPayload } from './user.types';
import FamilyModel from '../families/family.model';
import { sendEmail } from '../../common/services/email/email.service';

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  public async getProfile(userId: string): Promise<IUserDocument | null> {
    return this.userRepository.findById(userId);
  }

  public async updateProfile(userId: string, payload: UpdateProfilePayload & { familyApprovalStatus?: string; status?: string; approvedFamilies?: any[] }): Promise<IUserDocument | null> {
    if (payload.family) {
      const user = await this.userRepository.findById(userId);
      if (user?.family?.toString() !== payload.family) {
        const isAlreadyApproved = user?.approvedFamilies?.some(f => f.toString() === payload.family);

        if (isAlreadyApproved) {
          payload.familyApprovalStatus = 'approved';
          payload.status = 'active';
        } else {
          const family = await FamilyModel.findById(payload.family);
          if (family) {
            if (family.requiresAdminApproval) {
              payload.familyApprovalStatus = 'pending';
              payload.status = 'inactive';
            } else {
              payload.familyApprovalStatus = 'approved';
              payload.approvedFamilies = [...(user?.approvedFamilies || []), payload.family];
            }
          }
        }
      }
    }
    return this.userRepository.update(userId, payload);
  }

  public async getUserById(userId: string): Promise<IUserDocument | null> {
    return this.userRepository.findById(userId);
  }

  public async getAllUsers(filter: UserQuery = {}): Promise<IUserDocument[]> {
    return this.userRepository.findAll(filter);
  }

  public async deleteUser(userId: string): Promise<IUserDocument | null> {
    return this.userRepository.delete(userId);
  }

  public async changeUserStatus(userId: string, payload: ChangeStatusPayload): Promise<IUserDocument | null> {
    return this.userRepository.updateStatus(userId, payload);
  }

  public async approveFamily(userId: string, payload: ApproveFamilyPayload): Promise<IUserDocument | null> {
    const user = await this.userRepository.findById(userId);
    if (!user || !user.family) throw new Error('User or family not found');

    const updatePayload: any = { familyApprovalStatus: payload.status };
    
    if (payload.status === 'approved') {
      updatePayload.status = 'active';
      const isAlreadyApproved = user.approvedFamilies?.some(f => f.toString() === user.family?.toString());
      if (!isAlreadyApproved) {
        updatePayload.approvedFamilies = [...(user.approvedFamilies || []), user.family];
      }
    } else {
      updatePayload.status = 'inactive';
    }

    const updatedUser = await this.userRepository.update(userId, updatePayload);
    
    if (updatedUser) {
      const family = await FamilyModel.findById(updatedUser.family);
      await sendEmail({
        to: updatedUser.email,
        subject: `Your family request has been ${payload.status}`,
        text: `Your request to join the family ${family?.name || ''} has been ${payload.status}.`,
        html: `<p>Your request to join the family <b>${family?.name || ''}</b> has been ${payload.status}.</p>`,
      });
    }

    return updatedUser;
  }
}
