import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard.js';
import { PermissionGuard } from '../../../core/guards/permission.guard.js';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator.js';
import { PaginationDto } from '../../../common/dtos/pagination.dto.js';
import { Role } from '../entities/role.entity.js';
import { RolePermission } from '../entities/role-permission.entity.js';
import { RoleService } from '../services/role.service.js';
import { CreateRoleDto } from '../dto/create-role.dto.js';
import { ReplaceRolePermissionsDto } from '../dto/replace-role-permissions.dto.js';

@ApiTags('Roles')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class RolesController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('roles:create')
  @ApiOperation({ summary: 'Create a role' })
  @ApiBody({ type: CreateRoleDto })
  @ApiOkResponse({ description: 'Role created', type: Role })
  async createRole(@Body() dto: CreateRoleDto): Promise<Role> {
    return this.roleService.createRole(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'List roles' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiOkResponse({ description: 'Roles list loaded' })
  async listRoles(
    @Query() query: PaginationDto,
  ): Promise<{ items: Role[]; total: number; page: number; limit: number }> {
    const safePage = Math.max(1, query.page ?? 1);
    const safeLimit = Math.min(100, Math.max(1, query.limit ?? 20));
    const { roles, total } = await this.roleService.findMany(
      safePage,
      safeLimit,
    );
    return {
      items: roles,
      total,
      page: safePage,
      limit: safeLimit,
    };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('roles:read')
  @ApiOperation({ summary: 'Get role detail with permissions' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Role detail loaded' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async getRoleById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<Role> {
    return this.roleService.getByIdWithPermissionsOrThrow(id);
  }

  @Post(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('roles:update')
  @ApiOperation({ summary: 'Assign additional permissions to role' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: ReplaceRolePermissionsDto })
  @ApiOkResponse({
    description: 'Permissions assigned',
    type: [RolePermission],
  })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async assignPermissions(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReplaceRolePermissionsDto,
  ): Promise<RolePermission[]> {
    return this.roleService.assignPermissionsByIds(id, dto.permissionIds);
  }

  @Put(':id/permissions')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('roles:update')
  @ApiOperation({ summary: 'Replace all permissions of role' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: ReplaceRolePermissionsDto })
  @ApiOkResponse({ description: 'Role permissions replaced' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  async replacePermissions(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ReplaceRolePermissionsDto,
  ): Promise<void> {
    await this.roleService.replacePermissionsByIds(id, dto.permissionIds);
  }
}
