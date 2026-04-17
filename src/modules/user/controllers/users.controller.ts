import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
// `import type` required: isolatedModules + emitDecoratorMetadata cannot emit
// runtime metadata for interfaces used in decorated method signatures.
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AdminUpdateUserDto } from '../dto/admin-update-user.dto';
import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { PaginationDto } from '../../../common/dtos/pagination.dto';

@ApiTags('Users')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
  async getUserById(@Param('id', new ParseUUIDPipe()) id: string): Promise<User> {
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
  async restoreUserById(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.usersService.restoreUser(id);
  }
}
