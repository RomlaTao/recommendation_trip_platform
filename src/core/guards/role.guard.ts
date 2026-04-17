import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

type RequestUser = {
  roleCode?: string;
  roleCodes?: string[];
};

export const REQUIRED_ROLES_KEY = 'roles';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const candidateRoles = request.user?.roleCodes?.length
      ? request.user.roleCodes
      : request.user?.roleCode
        ? [request.user.roleCode]
        : [];
    const hasRequiredRole = requiredRoles.some((role) => candidateRoles.includes(role));
    if (!hasRequiredRole) {
      throw new ForbiddenException('insufficient_roles');
    }
    return true;
  }
}
