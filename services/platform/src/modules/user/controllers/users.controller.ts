import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  Patch,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { AdminUpdateUserDto } from '../dto/admin-update-user.dto';
import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PaginationDto } from '../../../common/dtos/pagination.dto';
import { UserRoleService } from '../../permission/services/user-role.service';
import { AssignUserRolesDto } from '../../permission/dto/assign-user-roles.dto';
import { SetPrimaryUserRoleDto } from '../../permission/dto/set-primary-user-role.dto';
import { UserRoleSummaryDto } from '../../permission/dto/user-role-summary.dto';

@ApiTags('Users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly userRoleService: UserRoleService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'List users (admin/moderator)' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiOkResponse({ description: 'List users successfully' })
  async listUsers(
    @Query() query: PaginationDto,
  ): Promise<{ items: User[]; total: number; page: number; limit: number }> {
    return this.usersService.getListUsers(query.page, query.limit);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get user by id (admin/moderator)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'Get user successfully', type: User })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<User> {
    return this.usersService.getUserById(id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Update user by id (admin/moderator)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: AdminUpdateUserDto })
  @ApiOkResponse({ description: 'Update user successfully', type: User })
  @ApiNotFoundResponse({ description: 'User not found' })
  async updateUserById(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AdminUpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('users:delete')
  @ApiOperation({ summary: 'Soft delete user by id (admin/moderator)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiNoContentResponse({ description: 'Delete user successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async deleteUserById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.usersService.deleteUser(id);
  }

  @Patch(':id/restore')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('users:delete') // restore is same as delete
  @ApiOperation({ summary: 'Restore user by id (admin/moderator)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiNoContentResponse({ description: 'Restore user successfully' })
  @ApiNotFoundResponse({ description: 'User not found' })
  async restoreUserById(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    return this.usersService.restoreUser(id);
  }

  @Get(':id/roles')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('users:read')
  @ApiOperation({ summary: 'Get roles assigned to user' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ description: 'User roles loaded', type: UserRoleSummaryDto })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getUserRoles(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<UserRoleSummaryDto> {
    return this.userRoleService.getUserRoleSummary(id);
  }

  @Put(':id/roles')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Replace all roles for user (multi-role)' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: AssignUserRolesDto })
  @ApiOkResponse({
    description: 'User roles replaced',
    type: UserRoleSummaryDto,
  })
  @ApiNotFoundResponse({ description: 'User or role not found' })
  async replaceUserRoles(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AssignUserRolesDto,
  ): Promise<UserRoleSummaryDto> {
    await this.userRoleService.replaceRolesByCodes(
      id,
      dto.roleCodes,
      dto.primaryRoleCode,
    );
    return this.userRoleService.getUserRoleSummary(id);
  }

  @Patch(':id/roles/assign')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Assign additional roles to user' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: AssignUserRolesDto })
  @ApiOkResponse({
    description: 'User roles updated',
    type: UserRoleSummaryDto,
  })
  @ApiNotFoundResponse({ description: 'User or role not found' })
  async assignUserRoles(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: AssignUserRolesDto,
  ): Promise<UserRoleSummaryDto> {
    await this.userRoleService.assignRolesByCodes(
      id,
      dto.roleCodes,
      dto.primaryRoleCode,
    );
    return this.userRoleService.getUserRoleSummary(id);
  }

  @Patch(':id/roles/primary')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Set primary role for user' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: SetPrimaryUserRoleDto })
  @ApiOkResponse({
    description: 'Primary role updated',
    type: UserRoleSummaryDto,
  })
  @ApiNotFoundResponse({ description: 'User or role not found' })
  async setPrimaryRole(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetPrimaryUserRoleDto,
  ): Promise<UserRoleSummaryDto> {
    await this.userRoleService.setPrimaryRoleByCode(id, dto.roleCode);
    return this.userRoleService.getUserRoleSummary(id);
  }

  @Delete(':id/roles/:roleCode')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('users:update')
  @ApiOperation({ summary: 'Remove role from user' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiParam({ name: 'roleCode', type: String, example: 'MODERATOR' })
  @ApiNoContentResponse({ description: 'Role removed from user' })
  @ApiNotFoundResponse({ description: 'User or role mapping not found' })
  async removeRoleFromUser(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('roleCode') roleCode: string,
  ): Promise<void> {
    await this.userRoleService.removeRoleByCode(id, roleCode);
  }
}
