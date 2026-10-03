import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { Request, Response } from 'express';

// PostgreSQL constraint violations that are client errors, not server faults
const PG_ERRORS: Record<string, { status: HttpStatus; message: string }> = {
  '23505': { status: HttpStatus.CONFLICT, message: 'A record with this information already exists' },
  '23503': { status: HttpStatus.BAD_REQUEST, message: 'Invalid reference to a related record' },
  '23502': { status: HttpStatus.BAD_REQUEST, message: 'A required field is missing' },
  '23514': { status: HttpStatus.BAD_REQUEST, message: 'Invalid data format' },
  '22P02': { status: HttpStatus.BAD_REQUEST, message: 'Invalid input value' },
};

// "Not Found" style label for a status code, e.g. 404 -> "Not Found"
const statusLabel = (status: number) =>
  (HttpStatus[status] ?? 'Error')
    .toString()
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as { message?: string | string[]; error?: string };
        message = responseObj.message || responseObj.error || exception.message;
        error = responseObj.error;
      }
    } else if (exception instanceof QueryFailedError && PG_ERRORS[(exception as any).code]) {
      ({ status, message } = PG_ERRORS[(exception as any).code]);
    }

    if (status >= 500) {
      // Full details go to the server log only; the client gets a generic message
      console.error('Unhandled error:', {
        url: request.url,
        method: request.method,
        userId: (request as any).user?.id,
        error: exception instanceof Error ? exception.stack : exception,
      });
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error: error ?? statusLabel(status),
    });
  }
}
