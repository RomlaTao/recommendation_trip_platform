import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { ERROR_MESSAGES } from '../../../common/constants/error-messages.constant.js';
import { UserRole } from '../entities/user-role.entity.js';
import { Role } from '../entities/role.entity.js';
import { User } from '../../user/entities/user.entity.js';
import { UserRoleSummaryDto } from '../dto/user-role-summary.dto.js';

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getRoleCodesByUserId(userId: string): Promise<string[]> {
    const mappings = await this.userRoleRepository.find({
      where: { userId },
      relations: { role: true },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });

    return mappings.map((mapping) => mapping.role.code);
  }

  async getUserRoleSummary(userId: string): Promise<UserRoleSummaryDto> {
    await this.assertUserExists(userId);
    const mappings = await this.getMappingsWithRoles(userId);
    const primary = mappings.find((item) => item.isPrimary);
    return {
      userId,
      roleCodes: mappings.map((item) => item.role.code),
      primaryRoleCode: primary?.role.code,
    };
  }

  async getPrimaryRoleCodeByUserId(
    userId: string,
  ): Promise<string | undefined> {
    const primary = await this.userRoleRepository.findOne({
      where: { userId, isPrimary: true, deletedAt: IsNull() },
      relations: { role: true },
    });
    if (primary) return primary.role.code;

    const fallback = await this.userRoleRepository.findOne({
      where: { userId, deletedAt: IsNull() },
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
    await this.assertUserExists(userId);
    const normalizedRoleCodes = [...new Set(roleCodes)];
    if (normalizedRoleCodes.length === 0) return;

    const roles = await this.roleRepository.find({
      where: { code: In(normalizedRoleCodes) },
    });
    if (roles.length !== normalizedRoleCodes.length) {
      throw new NotFoundException(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }

    const existingMappings = await this.getMappingsWithRoles(userId);
    const existingByRoleId = new Map(
      existingMappings.map((mapping) => [mapping.roleId, mapping]),
    );
    const mappingsWithDeleted =
      await this.getMappingsWithRolesIncludingDeleted(userId);
    const deletedByRoleId = new Map(
      mappingsWithDeleted
        .filter((mapping) => mapping.deletedAt !== null)
        .map((mapping) => [mapping.roleId, mapping]),
    );

    for (const role of roles) {
      if (existingByRoleId.has(role.id)) {
        continue;
      }
      const deletedMapping = deletedByRoleId.get(role.id);
      if (deletedMapping) {
        await this.userRoleRepository.restore(deletedMapping.id);
        await this.userRoleRepository.update(
          { id: deletedMapping.id },
          { isPrimary: false },
        );
        continue;
      }

      await this.userRoleRepository.save(
        this.userRoleRepository.create({
          userId,
          roleId: role.id,
          isPrimary: false,
        }),
      );
    }

    const mergedMappings = await this.getMappingsWithRoles(userId);
    const desiredPrimaryCode =
      primaryRoleCode ??
      mergedMappings.find((item) => item.isPrimary)?.role.code ??
      normalizedRoleCodes[0];
    await this.updatePrimaryRole(userId, desiredPrimaryCode, mergedMappings);
  }

  async replaceRolesByCodes(
    userId: string,
    roleCodes: string[],
    primaryRoleCode?: string,
  ): Promise<void> {
    await this.assertUserExists(userId);
    await this.userRoleRepository.softDelete({ userId });
    if (roleCodes.length === 0) return;
    await this.assignRolesByCodes(userId, roleCodes, primaryRoleCode);
  }

  async setPrimaryRoleByCode(userId: string, roleCode: string): Promise<void> {
    await this.assertUserExists(userId);
    const mappings = await this.getMappingsWithRoles(userId);
    await this.updatePrimaryRole(userId, roleCode, mappings);
  }

  async removeRoleByCode(userId: string, roleCode: string): Promise<void> {
    await this.assertUserExists(userId);
    const mappings = await this.getMappingsWithRoles(userId);
    const target = mappings.find((mapping) => mapping.role.code === roleCode);
    if (!target) {
      throw new NotFoundException(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
    if (mappings.length === 1) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION_FAILED);
    }

    await this.userRoleRepository.softDelete({ id: target.id });
    if (target.isPrimary) {
      const remainings = mappings.filter((mapping) => mapping.id !== target.id);
      await this.updatePrimaryRole(userId, remainings[0].role.code, remainings);
    }
  }

  private async assertUserExists(userId: string): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
  }

  private async getMappingsWithRoles(userId: string): Promise<UserRole[]> {
    return this.userRoleRepository.find({
      where: { userId, deletedAt: IsNull() },
      relations: { role: true },
      order: { isPrimary: 'DESC', createdAt: 'ASC' },
    });
  }

  private async getMappingsWithRolesIncludingDeleted(
    userId: string,
  ): Promise<UserRole[]> {
    return this.userRoleRepository.find({
      where: { userId },
      withDeleted: true,
      relations: { role: true },
      order: { createdAt: 'ASC' },
    });
  }

  private async updatePrimaryRole(
    userId: string,
    roleCode: string,
    mappings: UserRole[],
  ): Promise<void> {
    if (mappings.length === 0) {
      throw new NotFoundException(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
    const target = mappings.find((mapping) => mapping.role.code === roleCode);
    if (!target) {
      throw new NotFoundException(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }

    await this.userRoleRepository.update(
      { userId, deletedAt: IsNull() },
      { isPrimary: false },
    );
    await this.userRoleRepository.update(
      { id: target.id },
      { isPrimary: true },
    );
  }
}
