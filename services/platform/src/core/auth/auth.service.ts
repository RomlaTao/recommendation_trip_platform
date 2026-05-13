import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface.js';
import { TokenConfig } from '../config/token.config.js';
import { EmailConfig } from '../config/email.config.js';
import { User } from '../../modules/user/entities/user.entity.js';
import { UsersService } from '../../modules/user/users.service.js';
import {
  USER_TOKEN_TYPES,
  UserTokenEntity,
} from '../../modules/user/entities/user-token.entity.js';
import { NotificationService } from '../../modules/notification/services/notification.service.js';
import { UserRoleService } from '../../modules/permission/services/user-role.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { ERROR_MESSAGES } from '../../common/constants/error-messages.constant.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  /** Seconds until the access token expires (for the client to schedule refresh) */
  expiresIn: number;
}

export type RegisterResult = null;
export type LoginResult = { user: User; tokens: TokenPair };
export type RefreshTokensResult = { tokens: TokenPair };
export type LogoutResult = null;
export type VerifyEmailResult = null;

@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly tokenConfig: TokenConfig;
  private readonly emailConfig: EmailConfig;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly notificationService: NotificationService,
    private readonly userRoleService: UserRoleService,
    private readonly configService: ConfigService,
    @InjectRepository(UserTokenEntity)
    private readonly userTokenRepository: Repository<UserTokenEntity>,
  ) {
    this.tokenConfig = this.configService.get<TokenConfig>('token')!;
    this.emailConfig = this.configService.get<EmailConfig>('email')!;
  }

  // ── Public flows ───────────────────────────────────────────────────────────

  async register(dto: RegisterDto): Promise<RegisterResult> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException(ERROR_MESSAGES.CONFLICT);
    }

    if (dto.password !== dto.passwordConfirmation) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION_FAILED);
    }

    const passwordHash = await this._hashing(dto.password);
    const createdUser = await this.usersService.createLocalUser({
      email: dto.email,
      passwordHash,
      username: dto.username,
      isActive: false,
    });
    const defaultRoleCode = this.configService.get<string>(
      'DEFAULT_USER_ROLE_CODE',
      'USER',
    );
    await this.userRoleService.assignRolesByCodes(createdUser.id, [
      defaultRoleCode,
    ]);
    await this._issueVerifyEmailToken(createdUser.id, dto.email, dto.username);

    return null;
  }

  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || !user.passwordHash) {
      // Use a constant-time comparison stub to prevent user enumeration via
      // timing differences — even though we will not find a match.
      await this._hashing(dto.password);
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const passwordValid = await this._comparePassword(
      dto.password,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (user.deletedAt !== null) {
      throw new UnauthorizedException(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }

    const roleCodes = await this.userRoleService.getRoleCodesByUserId(user.id);
    const tokens = await this._generateTokenPair(
      user.id,
      user.email,
      roleCodes,
    );
    return { user, tokens };
  }

  async refreshTokens(rawRefreshToken: string): Promise<RefreshTokensResult> {
    const now = new Date();
    const refreshTokenHash = this._hashToken(rawRefreshToken);
    const tokenRecord = await this.userTokenRepository.findOne({
      where: {
        type: USER_TOKEN_TYPES.REFRESH_TOKEN,
        tokenHash: refreshTokenHash,
        revokedAt: IsNull(),
        consumedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const user = await this.usersService.findById(tokenRecord.userId);
    if (!user || !user.isActive || user.deletedAt !== null) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    tokenRecord.lastUsedAt = now;
    tokenRecord.revokedAt = now;
    await this.userTokenRepository.save(tokenRecord);

    const roleCodes = await this.userRoleService.getRoleCodesByUserId(user.id);
    const tokens = await this._generateTokenPair(
      user.id,
      user.email,
      roleCodes,
    );

    return { tokens };
  }

  async logout(userId: string): Promise<LogoutResult> {
    await this.userTokenRepository.update(
      {
        userId,
        type: USER_TOKEN_TYPES.REFRESH_TOKEN,
        revokedAt: IsNull(),
      },
      { revokedAt: new Date() },
    );
    return null;
  }

  async verifyEmailToken(token: string): Promise<VerifyEmailResult> {
    const now = new Date();
    const tokenHash = this._hashToken(token);
    const tokenRecord = await this.userTokenRepository.findOne({
      where: {
        type: USER_TOKEN_TYPES.VERIFY_EMAIL,
        tokenHash,
        revokedAt: IsNull(),
        consumedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
    });

    if (!tokenRecord) {
      throw new BadRequestException(ERROR_MESSAGES.VALIDATION_FAILED);
    }

    tokenRecord.consumedAt = now;
    tokenRecord.lastUsedAt = now;
    await this.userTokenRepository.save(tokenRecord);

    await this.usersService.activateUser(tokenRecord.userId);
    await this._revokeActiveTokensByType(
      tokenRecord.userId,
      USER_TOKEN_TYPES.VERIFY_EMAIL,
    );
    return null;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private async _generateTokenPair(
    userId: string,
    email: string,
    roleCodes: string[],
  ): Promise<TokenPair> {
    const primaryRoleCode = roleCodes[0];
    const accessPayload: JwtPayload = {
      sub: userId,
      email,
      roleCode: primaryRoleCode,
      roleCodes,
      type: 'access',
    };
    const accessToken = await this._generateJWTToken(
      accessPayload,
      this.tokenConfig.accessSecret,
      this.tokenConfig.accessExpiresIn,
    );
    const refreshToken = this._generateRandomToken();
    const refreshExpiresAt = new Date(
      Date.now() +
        this._parseExpiryToSeconds(this.tokenConfig.refreshExpiresIn) * 1000,
    );

    await this.userTokenRepository.save(
      this.userTokenRepository.create({
        userId,
        tokenHash: this._hashToken(refreshToken),
        type: USER_TOKEN_TYPES.REFRESH_TOKEN,
        expiresAt: refreshExpiresAt,
      }),
    );

    // Parse expiry string to seconds for the client (e.g. '15m' → 900)
    const expiresIn = this._parseExpiryToSeconds(
      this.tokenConfig.accessExpiresIn,
    );

    return { accessToken, refreshToken, expiresIn };
  }

  private async _issueVerifyEmailToken(
    userId: string,
    email: string,
    username?: string,
  ): Promise<void> {
    const verifyToken = this._generateRandomToken();
    const expiresAt = new Date(
      Date.now() + this.emailConfig.verifyTokenTtlSeconds * 1000,
    );

    await this._revokeActiveTokensByType(userId, USER_TOKEN_TYPES.VERIFY_EMAIL);

    await this.userTokenRepository.save(
      this.userTokenRepository.create({
        userId,
        type: USER_TOKEN_TYPES.VERIFY_EMAIL,
        tokenHash: this._hashToken(verifyToken),
        expiresAt,
      }),
    );

    await this.notificationService.notifyVerifyEmail({
      to: email,
      username,
      verifyToken,
    });
  }

  private async _revokeActiveTokensByType(
    userId: string,
    tokenType: (typeof USER_TOKEN_TYPES)[keyof typeof USER_TOKEN_TYPES],
  ): Promise<void> {
    await this.userTokenRepository.update(
      {
        userId,
        type: tokenType,
        revokedAt: IsNull(),
        consumedAt: IsNull(),
      },
      { revokedAt: new Date() },
    );
  }

  /**
   * Converts a JWT expiry string like '15m', '1h', '7d' to seconds.
   * Falls back to 900 (15 minutes) for unrecognised formats.
   */
  private _parseExpiryToSeconds(expiry: string): number {
    const match = /^(\d+)(s|m|h|d)$/.exec(expiry);
    if (!match) return 900;

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1,
      m: 60,
      h: 3600,
      d: 86400,
    };
    return value * (multipliers[unit] ?? 1);
  }

  private _hashing(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  private _comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private _generateRandomToken(): string {
    return randomBytes(48).toString('hex');
  }

  private _generateJWTToken(
    payload: JwtPayload,
    secret: string,
    expiresIn: string,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret,
      expiresIn: expiresIn as JwtSignOptions['expiresIn'],
    });
  }

  private _hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
