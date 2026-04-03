import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  Logger,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const errorId = uuidv4();
    let status: number;
    let message: string;

    if (exception instanceof HttpException) {
      const httpEx: HttpException = exception;
      status = httpEx.getStatus();
      const resp = httpEx.getResponse() as any;
      // ValidationPipe returns resp.message as a string[] — join for display
      const raw = resp?.message ?? httpEx.message;
      message = Array.isArray(raw) ? raw.join('; ') : String(raw);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      // Never expose raw system/SMTP errors to the client
      message = 'An unexpected error occurred. Please try again later.';
    }

    // Log the error with ID and request context
    try {
      const stack = (exception as any)?.stack || null;
      const exceptionData = {
        exception: {
          name: (exception as any)?.name || null,
          message: (exception as any)?.message || null,
          stack,
        },
        body: req.body,
        params: req.params,
        query: req.query,
      };
      this.logger.error(
        `ErrorID=${errorId} ${req.method} ${req.url} ${message}`,
        JSON.stringify(exceptionData),
      );
    } catch (err) {
      this.logger.error(`Error logging exception: ${err as any}`);
    }

    // Return standard JSON error structure with errorId
    res.status(status).json({
      statusCode: status,
      errorId,
      message,
    });
  }
}
