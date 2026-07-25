import { UserRepository } from '../../modules/users/user.repository';
import { UserService } from '../../modules/users/user.service';
import { CreateUserPayload, ChangeStatusPayload } from '../../modules/users/user.types';

export class AdminUserService {
  private userService: UserService;
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
    this.userService = new UserService(this.userRepo);
  }

  public async createAdmin(payload: CreateUserPayload) {
    // callers must ensure caller has SUPER_ADMIN
    return this.userRepo.create(payload as any);
  }

  public async updateRole(userId: string, role: string) {
    return this.userRepo.update(userId, { role } as any);
  }

  public async deleteAdmin(userId: string) {
    return this.userRepo.delete(userId);
  }

  public async listUsers(filter?: Record<string, unknown>) {
    return this.userService.getAllUsers(filter as any);
  }

  public async getUser(userId: string) {
    return this.userService.getUserById(userId);
  }

  public async changeStatus(userId: string, payload: ChangeStatusPayload) {
    return this.userService.changeUserStatus(userId, payload);
  }
}
