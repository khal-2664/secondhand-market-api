import { HttpException, HttpStatus } from '@nestjs/common';

export class AppError extends HttpException {
  constructor(
    readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    readonly details?: unknown,
  ) {
    super(
      details !== undefined ? { code, message, details } : { code, message },
      status,
    );
  }
}
