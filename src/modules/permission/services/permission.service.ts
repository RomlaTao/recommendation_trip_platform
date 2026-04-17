import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ERROR_MESSAGES } from '../../../common/constants/error-messages.constant.js';
import { Permission } from '../entities/permission.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { Role } from '../entities/role.entity.js';

export type CreatePermissionInput = {
  resource: string;
  action: string;
  description?: string;
  code?: string;
};

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async createPermission(input: CreatePermissionInput): Promise<Permission> {
    const code = input.code ?? `${input.resource}:${input.action}`;

    const permission = this.permissionRepository.create({
      code,
      resource: input.resource,
      action: input.action,
    });
    return this.permissionRepository.save(permission);
  }

  async findByCode(code: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({ where: { code } });
  }

  async findById(id: string): Promise<Permission | null> {
    return this.permissionRepository.findOne({ where: { id } });
  }

  async findMany(
    page: number,
    limit: number,
  ): Promise<{ permissions: Permission[]; total: number }> {
    const [permissions, total] = await this.permissionRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { permissions, total };
  }

  async findByCodes(codes: string[]): Promise<Permission[]> {
    if (codes.length === 0) return [];
    return this.permissionRepository.find({
      where: { code: In(codes) },
    });
  }

  async getPermissionCodesByRoleCode(roleCode: string): Promise<string[]> {
    const role = await this.roleRepository.findOne({ where: { code: roleCode } });
    if (!role) {
      return [];
    }

    return this.getPermissionCodesByRoleId(role.id);
  }

  async getPermissionCodesByRoleId(roleId: string): Promise<string[]> {
    const mappings = await this.rolePermissionRepository.find({
      where: { roleId },
      relations: { permission: true },
    });

    return mappings.map((mapping) => mapping.permission.code);
  }

  async getPermissionCodesByRoleCodes(roleCodes: string[]): Promise<string[]> {
    if (roleCodes.length === 0) {
      return [];
    }
    const roles = await this.roleRepository.find({
      where: { code: In(roleCodes) },
    });
    if (roles.length === 0) {
      return [];
    }

    const mappings = await this.rolePermissionRepository.find({
      where: { roleId: In(roles.map((role) => role.id)) },
      relations: { permission: true },
    });
    return [...new Set(mappings.map((mapping) => mapping.permission.code))];
  }

  async assertPermissionExists(permissionId: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id: permissionId },
    });
    if (!permission) {
      throw new NotFoundException(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }
    return permission;
  }
}
