import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Socket } from 'socket.io';
import {
  JwtPayload,
  JwtRequestUser,
} from '../../../common/interfaces/jwt-payload.interface.js';
import { ERROR_MESSAGES } from '../../../common/constants/error-messages.constant.js';
import { TokenConfig } from '../../config/token.config.js';
import { UsersService } from '../../../modules/user/users.service.js';
import { PermissionService } from '../../../modules/permission/services/permission.service.js';

@Injectable()
export class WsAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly permissionService: PermissionService,
  ) {}

  async authenticate(socket: Socket): Promise<JwtRequestUser> {
    const token = this.extractToken(socket);
    if (!token) {
      throw new UnauthorizedException('missing_access_token');
    }

    const tokenConfig = this.configService.get<TokenConfig>('token')!;
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: tokenConfig.accessSecret,
      });
    } catch {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    if (payload.type !== 'access') {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive || user.deletedAt !== null) {
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    const roleCodes = payload.roleCodes?.length
      ? payload.roleCodes
      : payload.roleCode
        ? [payload.roleCode]
        : [];
    const permissions =
      await this.permissionService.getPermissionCodesByRoleCodes(roleCodes);

    return {
      ...payload,
      roleCodes,
      permissions,
    };
  }

  private extractToken(socket: Socket): string | null {
    const auth = socket.handshake.auth as { token?: string };
    if (typeof auth?.token === 'string' && auth.token.trim()) {
      return this.stripBearer(auth.token.trim());
    }

    const header = socket.handshake.headers.authorization;
    if (typeof header === 'string' && header.trim()) {
      return this.stripBearer(header.trim());
    }

    const queryToken = socket.handshake.query.token;
    if (typeof queryToken === 'string' && queryToken.trim()) {
      return this.stripBearer(queryToken.trim());
    }

    return null;
  }

  private stripBearer(value: string): string {
    return value.startsWith('Bearer ') ? value.slice(7).trim() : value;
  }
}
