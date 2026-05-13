import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../../common/errors/app.error.js';

/**
 * Global Exception Filter — HttpExceptionFilter
 *
 * Design rationale:
 * - Centralises ALL error formatting so every error response has the same shape
 *   regardless of where in the request lifecycle the exception was thrown.
 * - Catches NestJS HttpExceptions, project-level AppErrors, and unexpected
 *   runtime errors (500 fallback), ensuring stack traces never reach the
 *   client in any environment.
 * - Logs the full error server-side using NestJS Logger (structured logging
 *   ready — swap Logger for Winston/Pino without touching this class).
 *
 * Response contract (error):
 * {
 *   statusCode: number,
 *   message:    string | string[],  ← validation errors can be an array
 *   error:      string,
 *   timestamp:  string (ISO 8601),
 *   path:       string
 * }
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const responseBody = exception.getResponse();

      if (typeof responseBody === 'string') {
        message = responseBody;
        error = exception.message;
      } else if (typeof responseBody === 'object' && responseBody !== null) {
        const body = responseBody as Record<string, unknown>;
        message = (body.message as string | string[]) ?? exception.message;
        error = (body.error as string) ?? exception.message;
      }
    } else if (exception instanceof AppError) {
      statusCode = exception.statusCode;
      message = exception.message;
      error = exception.error;
    } else if (exception instanceof Error) {
      // Unexpected runtime error — log full stack, return generic 500
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception.stack,
      );
    }

    this.logger.warn(
      `[${statusCode}] ${request.method} ${request.url} — ${JSON.stringify(message)}`,
    );

    response.status(statusCode).json({
      code: statusCode,
      success: false,
      message,
      data: null,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
