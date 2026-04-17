import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity.js';
import {
  ExternalUserProfile,
  IUserIdentityProvider,
} from './interfaces/user-identity.interface.js';
import { UsersRepository } from './users.repository.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto.js';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant.js';
import { ResourceNotFoundError } from '../../common/errors/app.error.js';

/**
 * Users Service
 *
 * Design rationale:
 * - Implements IUserIdentityProvider to fulfil the SSO/JIT provisioning
 *   contract. When future OAuth strategies are added, they call
 *   `findOrCreateFromExternalIdentity` without knowing anything about the
 *   UsersService internals.
 * - Intentionally free of auth concerns (no JWT, no password hashing here).
 *   AuthService owns those responsibilities and calls UsersService as a
 *   dependency, following Single Responsibility.
 */
@Injectable()
export class UsersService implements IUserIdentityProvider {
  constructor(private readonly usersRepository: UsersRepository) {}

  // ======================= Auth Layer (called by AuthService, Strategies) =======================
  async findById(id: string): Promise<User | null> {
    return await this.usersRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findByEmail(email);
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return await this.usersRepository.findByEmailWithPassword(email);
  }

  async findByIdWithRole(id: string): Promise<User | null> {
    return await this.usersRepository.findByIdWithRole(id);
  }

  async createLocalUser(data: {
    email: string;
    passwordHash: string;
    username?: string;
    isActive?: boolean;
  }): Promise<User> {
    return this.usersRepository.create(data);
  }

  async activateUser(id: string): Promise<void> {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new ResourceNotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
    await this.usersRepository.update(id, { isActive: true });
  }

  async updateProfile(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new ResourceNotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
    const updated = await this.usersRepository.update(id, {
      ...dto,
    });
    if (!updated) {
      throw new ResourceNotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
    return updated;
  }

  // ======================= Admin Layer (called by UsersController) =======================

  async getListUsers(
    page = 1,
    limit = 20,
  ): Promise<{ items: User[]; total: number; page: number; limit: number }> {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const { users, total } = await this.usersRepository.findManyWithRole(
      safePage,
      safeLimit,
    );

    return {
      items: users,
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  async getUserById(id: string): Promise<User> {
    const user = await this.usersRepository.findByIdWithRole(id);
    if (!user) {
      throw new ResourceNotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
    return user;
  }

  async getCurrentUserProfile(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new ResourceNotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
    return user;
  }

  async updateUser(id: string, dto: AdminUpdateUserDto): Promise<User> {
    const existing = await this.usersRepository.findByIdWithRole(id);
    if (!existing) {
      throw new ResourceNotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }

    const updated = await this.usersRepository.update(id, { ...dto });
    if (!updated) {
      throw new ResourceNotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
    return updated;
  }

  async deleteUser(id: string): Promise<void> {
    const existing = await this.usersRepository.findById(id);
    if (!existing) {
      throw new ResourceNotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
    await this.usersRepository.softDelete(id);
  }

  async restoreUser(id: string): Promise<void> {
    const existing = await this.usersRepository.findByIdIncludingDeleted(id);
    if (!existing) {
      throw new ResourceNotFoundError(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
    await this.usersRepository.restore(id);
  }

  /**
   * IUserIdentityProvider implementation — SSO / JIT provisioning.
   *
   * Logic:
   *   1. Try to find by providerId + provider (returning user).
   *   2. Fallback: find by email (link existing local account to SSO).
   *   3. Neither found → create a new account (JIT provisioning).
   *
   * This three-step strategy handles the common case where a user registered
   * locally and later signs in with SSO using the same email address.
   */
  async findOrCreateFromExternalIdentity(
    profile: ExternalUserProfile,
  ): Promise<User> {
    // Step 1 — returning SSO user
    const existingBySso = await this.usersRepository.findByProviderId(
      profile.provider,
      profile.providerId,
    );
    if (existingBySso) return existingBySso;

    // Step 2 — link SSO to existing local account
    const existingByEmail = await this.usersRepository.findByEmail(
      profile.email,
    );
    if (existingByEmail) {
      return this.usersRepository.save({
        ...existingByEmail,
        provider: profile.provider,
        providerId: profile.providerId,
        avatarUrl: existingByEmail.avatarUrl ?? profile.avatarUrl,
      });
    }

    // Step 3 — JIT provision a new account
    return this.usersRepository.create({
      email: profile.email,
      username: profile.username,
      avatarUrl: profile.avatarUrl,
      provider: profile.provider,
      providerId: profile.providerId,
      // passwordHash intentionally omitted — SSO-only accounts cannot use
      // password login until they explicitly set one.
    });
  }
}
