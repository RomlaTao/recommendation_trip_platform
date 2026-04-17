import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import {
  JwtPayload,
  JwtRequestUser,
} from '../../../common/interfaces/jwt-payload.interface';
import { TokenConfig } from '../../config/token.config';
import { UsersService } from '../../../modules/user/users.service';
import { ERROR_MESSAGES } from '../../../common/constants/error-messages.constant';
import { PermissionService } from '../../../modules/permission/services/permission.service';

/**
 * JWT Access Token Strategy  (Passport strategy name: 'jwt')
 *
 * Design rationale:
 * - Extracts the bearer token from the Authorization header and verifies its
 *   signature against JWT_ACCESS_SECRET.
 * - The `validate` method is called only after the signature check passes.
 *   It checks: (a) the token type is 'access', (b) the user still exists and
 *   is active. This means a deactivated user's access token stops working
 *   immediately after the token's short TTL expires — or instantly if we add
 *   a token block-list here later.
 * - Returns the JwtPayload which Passport attaches to `req.user`. The
 *   @CurrentUser() decorator then reads it without an extra DB call for most
 *   endpoints (the full User record is only fetched when truly needed, e.g.
 *   GET /users/me).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly permissionService: PermissionService,
  ) {
    const jwtConfig = configService.get<TokenConfig>('token')!;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.accessSecret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtRequestUser> {
    // Guard against refresh tokens being used as access tokens
    if (payload.type !== 'access') {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (!user.isActive) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (user.deletedAt !== null) {
      throw new UnauthorizedException(ERROR_MESSAGES.RESOURCE_NOT_FOUND);
    }

    const roleCodes = payload.roleCodes?.length
      ? payload.roleCodes
      : payload.roleCode
        ? [payload.roleCode]
        : [];
    const permissions = await this.permissionService.getPermissionCodesByRoleCodes(roleCodes);

    // Attach dynamic permissions to req.user for PermissionGuard
    return {
      ...payload,
      roleCodes,
      permissions,
    };
  }
}
