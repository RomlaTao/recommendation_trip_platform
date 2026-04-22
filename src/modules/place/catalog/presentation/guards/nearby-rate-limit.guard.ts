import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';

interface HitBucket {
  windowStartMs: number;
  count: number;
}

@Injectable()
export class NearbyRateLimitGuard implements CanActivate {
  private readonly hits = new Map<string, HitBucket>();
  private readonly maxRequestsPerWindow = 30;
  private readonly windowMs = 60_000;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = this.resolveClientKey(request);
    const now = Date.now();
    const bucket = this.hits.get(key);

    if (!bucket || now - bucket.windowStartMs >= this.windowMs) {
      this.hits.set(key, { windowStartMs: now, count: 1 });
      return true;
    }

    if (bucket.count >= this.maxRequestsPerWindow) {
      throw new HttpException(
        {
          message: 'too_many_nearby_requests',
          retryAfterSeconds: Math.ceil((bucket.windowStartMs + this.windowMs - now) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    bucket.count += 1;
    return true;
  }

  private resolveClientKey(request: Request): string {
    const xForwardedFor = request.headers['x-forwarded-for'];
    if (typeof xForwardedFor === 'string' && xForwardedFor.length > 0) {
      return xForwardedFor.split(',')[0].trim();
    }
    return request.ip || 'unknown';
  }
}
