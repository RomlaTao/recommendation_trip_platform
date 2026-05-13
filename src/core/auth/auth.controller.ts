import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../guards/jwt-auth.guard.js';
import {
  AuthService,
  LogoutResult,
  RefreshTokensResult,
  RegisterResult,
  TokenPair,
  VerifyEmailResult,
} from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshTokenDto } from './dto/refresh-token.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register local account' })
  @ApiBody({ type: RegisterDto })
  @ApiCreatedResponse({ description: 'Register successfully' })
  @ApiConflictResponse({ description: 'Email already exists' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async register(@Body() dto: RegisterDto): Promise<RegisterResult> {
    return await this.authService.register(dto);
  }

  @Get('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email from token link' })
  @ApiQuery({ name: 'token', type: String, required: true })
  @ApiOkResponse({ description: 'Email verified successfully' })
  @ApiBadRequestResponse({ description: 'Invalid or expired verify token' })
  async verifyEmail(@Query('token') token: string): Promise<VerifyEmailResult> {
    return await this.authService.verifyEmailToken(token);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Login successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
  ): Promise<{ userId: string; tokens: TokenPair }> {
    const result = await this.authService.login(dto);
    return { userId: result.user.id, tokens: result.tokens };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({ description: 'Token refreshed successfully' })
  @ApiUnauthorizedResponse({ description: 'Refresh token invalid or expired' })
  async refresh(@Body() dto: RefreshTokenDto): Promise<RefreshTokensResult> {
    return await this.authService.refreshTokens(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout current user session' })
  @ApiOkResponse({ description: 'Logout successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  async logout(@CurrentUser('sub') userId: string): Promise<LogoutResult> {
    return await this.authService.logout(userId);
  }
}
