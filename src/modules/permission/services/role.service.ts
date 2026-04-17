import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ERROR_MESSAGES } from '../../../common/constants/error-messages.constant.js';
import { Permission } from '../entities/permission.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { Role } from '../entities/role.entity.js';

export type CreateRoleInput = {
  code: string;
  name: string;
  description?: string;
  isSystem?: boolean;
};

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async createRole(input: CreateRoleInput): Promise<Role> {
    const role = this.roleRepository.create({
      code: input.code,
      name: input.name,
      description: input.description,
      isSystem: input.isSystem ?? false,
    });
    return this.roleRepository.save(role);
  }

  async findByCode(code: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { code } });
  }

  async findById(id: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { id } });
  }

  async assignPermissionsByIds(
    roleId: string,
    permissionIds: string[],
  ): Promise<RolePermission[]> {
    const role = await this.findById(roleId);
    if (!role) {
      throw new NotFoundException(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }

    if (permissionIds.length === 0) {
      return [];
    }

    const permissions = await this.permissionRepository.find({
      where: { id: In(permissionIds) },
    });

    const permissionIdSet = new Set(permissions.map((permission) => permission.id));
    const validPermissionIds = permissionIds.filter((id) => permissionIdSet.has(id));
    if (validPermissionIds.length === 0) {
      return [];
    }

    const existingMappings = await this.rolePermissionRepository.find({
      where: {
        roleId,
        permissionId: In(validPermissionIds),
      },
    });
    const existingPermissionIdSet = new Set(
      existingMappings.map((mapping) => mapping.permissionId),
    );

    const newMappings = validPermissionIds
      .filter((permissionId) => !existingPermissionIdSet.has(permissionId))
      .map((permissionId) =>
        this.rolePermissionRepository.create({
          roleId,
          permissionId,
        }),
      );

    if (newMappings.length === 0) {
      return existingMappings;
    }

    return this.rolePermissionRepository.save(newMappings);
  }

  async replacePermissionsByIds(
    roleId: string,
    permissionIds: string[],
  ): Promise<void> {
    const role = await this.findById(roleId);
    if (!role) {
      throw new NotFoundException(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }

    await this.rolePermissionRepository.delete({ roleId });

    if (permissionIds.length === 0) {
      return;
    }

    const mappings = permissionIds.map((permissionId) =>
      this.rolePermissionRepository.create({
        roleId,
        permissionId,
      }),
    );
    await this.rolePermissionRepository.save(mappings);
  }
}
