import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

const GENERIC_SERVER_ERROR_MESSAGE = 'Lỗi hệ thống, vui lòng thử lại sau';

function extraHttpDetails(body: Record<string, unknown>): unknown {
  const extra: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(body)) {
    if (key === 'message' || key === 'statusCode') {
      continue;
    }
    if (key === 'error' && typeof value === 'string') {
      continue;
    }
    extra[key] = value;
  }

  return Object.keys(extra).length > 0 ? extra : undefined;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let code = HttpStatus[status] ?? 'INTERNAL_ERROR';
    let message = GENERIC_SERVER_ERROR_MESSAGE;
    let details: unknown;

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body !== null && typeof body === 'object') {
        const b = body as Record<string, unknown>;
        if (typeof b.code === 'string') {
          code = b.code;
          if (b.details !== undefined) {
            details = b.details;
          }
        } else {
          details = extraHttpDetails(b);
        }

        if (Array.isArray(b.message)) {
          message = b.message.join('; ');
        } else if (typeof b.message === 'string') {
          message = b.message;
        } else {
          message = exception.message;
        }
      }
    }

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      message = GENERIC_SERVER_ERROR_MESSAGE;
      this.logger.error(
        `${req.method} ${req.url} -> ${status} ${code}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${req.method} ${req.url} -> ${status} ${code}`);
    }

    res.status(status).json({
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
