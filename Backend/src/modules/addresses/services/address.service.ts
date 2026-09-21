import { AddressRepository, AddressQueryOptions } from '../repositories/address.repository';
import { CreateAddressPayload, UpdateAddressPayload } from '../types/address.types';

export class AddressService {
  constructor(private readonly repo: AddressRepository) {}

  public async createAddress(payload: CreateAddressPayload) {
    if (payload.isDefault) {
      await this.repo.unsetDefaultForUser(payload.user);
    }

    const created = await this.repo.create(payload as any);
    return created;
  }

  public async updateAddress(id: string, payload: UpdateAddressPayload, userId?: string) {
    if (payload.isDefault && (payload as any).user) {
      await this.repo.unsetDefaultForUser((payload as any).user);
    }

    if (payload.isDefault && !(payload as any).user) {
      const existing = await this.repo.findById(id);
      if (existing) await this.repo.unsetDefaultForUser(existing.user.toString());
    }

    if (userId) {
      return this.repo.updateOwned(id, payload as any, userId);
    }

    return this.repo.update(id, payload as any);
  }

  public async getAddress(id: string, userId?: string) {
    if (userId) {
      return this.repo.findOwnedById(id, userId);
    }
    return this.repo.findById(id);
  }

  public async getAddresses(userId?: string, isAdmin: boolean = false, options: AddressQueryOptions = {}) {
    if (isAdmin) {
      return this.repo.findAll(options);
    }
    if (!userId) {
      return [];
    }
    return this.repo.findByUser(userId);
  }

  public async getStats() {
    return this.repo.getStats();
  }

  public async deleteAddress(id: string, userId?: string) {
    if (userId) {
      return this.repo.softDeleteOwned(id, userId);
    }
    return this.repo.softDelete(id);
  }

  public async setDefaultAddress(id: string, userId: string) {
    await this.repo.unsetDefaultForUser(userId);
    return this.repo.updateOwned(id, { isDefault: true } as any, userId);
  }
}
