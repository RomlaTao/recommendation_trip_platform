import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ERROR_MESSAGES } from '../../../common/constants/error-messages.constant.js';
import { UserRole } from '../entities/user-role.entity.js';
import { Role } from '../entities/role.entity.js';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async getRoleCodesByUserId(userId: string): Promise<string[]> {
    const mappings = await this.userRoleRepository.find({
      where: { userId },
      relations: { role: true },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });

    return mappings.map((mapping) => mapping.role.code);
  }

  async getPrimaryRoleCodeByUserId(userId: string): Promise<string | undefined> {
    const primary = await this.userRoleRepository.findOne({
      where: { userId, isPrimary: true },
      relations: { role: true },
    });
    if (primary) return primary.role.code;

    const fallback = await this.userRoleRepository.findOne({
      where: { userId },
      relations: { role: true },
      order: { createdAt: 'ASC' },
    });
    return fallback?.role.code;
  }

  async assignRolesByCodes(
    userId: string,
    roleCodes: string[],
    primaryRoleCode?: string,
  ): Promise<void> {
    if (roleCodes.length === 0) {
      return;
    }

    const roles = await this.roleRepository.find({
      where: { code: In(roleCodes) },
    });
    if (roles.length === 0) {
      throw new NotFoundException(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }

    const desiredPrimaryCode = primaryRoleCode ?? roleCodes[0];
    const desiredPrimaryRole = roles.find((role) => role.code === desiredPrimaryCode);

    const mappings = roles.map((role) =>
      this.userRoleRepository.create({
        userId,
        roleId: role.id,
        isPrimary: desiredPrimaryRole ? role.id === desiredPrimaryRole.id : false,
      }),
    );
    await this.userRoleRepository.save(mappings);
  }

  async replaceRolesByCodes(
    userId: string,
    roleCodes: string[],
    primaryRoleCode?: string,
  ): Promise<void> {
    await this.userRoleRepository.delete({ userId });
    if (roleCodes.length === 0) return;
    await this.assignRolesByCodes(userId, roleCodes, primaryRoleCode);
  }
}
