import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        const message =
            exception instanceof HttpException
                ? exception.getResponse()
                : exception instanceof Error ? exception.message : 'Internal server error';

        // Log the actual error stack for the server
        if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            this.logger.error(
                `[${request.method}] ${request.url} - ${exception instanceof Error ? exception.message : 'Unknown Error'}`,
                exception instanceof Error ? exception.stack : '',
            );
        } else {
            this.logger.warn(`[${request.method}] ${request.url} - Status: ${status}`);
        }

        // Prepare a sanitized response for the client
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: typeof message === 'string' ? message : (message as any).message || message,
        };

        // If production, completely mask 500 errors to prevent DB/implementation leakage
        if (process.env.NODE_ENV === 'production' && status === HttpStatus.INTERNAL_SERVER_ERROR) {
            errorResponse.message = 'An unexpected internal error occurred.';
        }

        response.status(status).json(errorResponse);
    }
}
