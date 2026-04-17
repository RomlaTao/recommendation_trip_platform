import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
// `import type` required: isolatedModules + emitDecoratorMetadata cannot emit
// runtime metadata for interfaces used in decorated method signatures.
import type { JwtPayload } from '../../../common/interfaces/jwt-payload.interface';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';
@ApiTags('Account')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized' })
@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiOkResponse({ description: 'Get profile successfully', type: User })
  @ApiNotFoundResponse({ description: 'User not found' })
  async getProfile(@CurrentUser() payload: JwtPayload): Promise<User> {
    return this.usersService.getCurrentUserProfile(payload.sub);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'Update profile successfully', type: User })
  @ApiNotFoundResponse({ description: 'User not found' })
  async updateProfile(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<User> {
    return this.usersService.updateProfile(userId, dto);
  }
}