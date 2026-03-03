import { Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryExceptionFilter extends BaseExceptionFilter {
    private readonly logger = new Logger('SentryExceptionFilter');

    catch(exception: unknown, host: ArgumentsHost) {
        // Só reportar ao Sentry erros que NÃO são HttpException esperados
        // (404, 401, 403 são normais — não poluir o Sentry)
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            if (status >= 500) {
                Sentry.captureException(exception);
                this.logger.error('Server error captured by Sentry', exception.stack);
            }
        } else {
            // Erros não-HTTP são sempre reportados (crashes, DB errors, etc)
            Sentry.captureException(exception);
            this.logger.error('Unhandled exception captured by Sentry',
                exception instanceof Error ? exception.stack : String(exception)
            );
        }

        // Delegar ao handler padrão do NestJS (retorna o erro ao cliente)
        super.catch(exception, host);
    }
}
