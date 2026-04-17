import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { JwtPayload } from '../interfaces/jwt-payload.interface.js';

/**
 * @CurrentUser() Parameter Decorator
 *
 * Design rationale:
 * - Provides a type-safe way for controllers to access the authenticated user
 *   without reaching into `req.user` directly, which would be untyped.
 * - The generic `data` parameter allows extracting a single field:
 *     @CurrentUser()           → returns the full JwtPayload object
 *     @CurrentUser('sub')      → returns just the user ID string
 *     @CurrentUser('role')     → returns just the UserRole enum value
 * - Works because JwtStrategy.validate() attaches the decoded payload to
 *   `req.user` after token verification succeeds.
 *
 * Usage:
 *   @Get('me')
 *   getProfile(@CurrentUser() user: JwtPayload) { ... }
 *
 *   @Delete(':id')
 *   remove(@CurrentUser('sub') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request & { user: JwtPayload }>();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
