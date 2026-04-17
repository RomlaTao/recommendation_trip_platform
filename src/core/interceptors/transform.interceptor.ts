import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { map, Observable } from 'rxjs';

type ApiEnvelope<T> = {
  code: number;
  success: boolean;
  message: string;
  data: T;
};

/**
 * Bọc output từ controller thành một envelope chuẩn để trả về
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiEnvelope<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiEnvelope<T>> {
    return next.handle().pipe(
      map((payload) => {
        if (
          typeof payload === 'object' &&
          payload !== null &&
          'success' in (payload as Record<string, unknown>) &&
          'data' in (payload as Record<string, unknown>)
        ) {
          return payload as unknown as ApiEnvelope<T>;
        }

        return {
          code: 200,
          success: true,
          message: 'ok',
          data: payload,
        };
      }),
    );
  }
}
