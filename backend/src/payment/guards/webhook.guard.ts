import {
    CanActivate,
    ExecutionContext,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import type { Request } from 'express';

/**
 * WebhookSignatureGuard
 *
 * Validates the AppyPay webhook signature using HMAC-SHA256.
 * The secret is read from APPYPAY_WEBHOOK_SECRET env var.
 *
 * TODO: Activate when AppyPay shares the exact signature header name
 *       and signing algorithm. Currently the controller has this guard commented out.
 *
 * Expected header: x-appypay-signature (to confirm with AppyPay docs)
 * Expected format: HMAC-SHA256 hex digest of raw body with APPYPAY_WEBHOOK_SECRET
 */
@Injectable()
export class WebhookSignatureGuard implements CanActivate {
    private readonly logger = new Logger(WebhookSignatureGuard.name);
    private static readonly HEADER = 'x-appypay-signature';

    canActivate(context: ExecutionContext): boolean {
        const secret = process.env.APPYPAY_WEBHOOK_SECRET;

        // If no secret configured, skip validation (dev mode)
        if (!secret) {
            this.logger.warn('[WebhookGuard] APPYPAY_WEBHOOK_SECRET not set — skipping signature check');
            return true;
        }

        const request = context.switchToHttp().getRequest<Request>();
        const signature = request.headers[WebhookSignatureGuard.HEADER] as string | undefined;

        if (!signature) {
            this.logger.warn('[WebhookGuard] Missing signature header');
            throw new UnauthorizedException('Missing webhook signature');
        }

        // Raw body fallback if middleware fails (though verify should set it)
        const rawBody = (request as any).rawBody ?? Buffer.from(JSON.stringify(request.body));

        const expected = crypto
            .createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expected),
        );

        if (!isValid) {
            this.logger.warn('[WebhookGuard] Invalid signature — rejecting webhook');
            throw new UnauthorizedException('Invalid webhook signature');
        }

        return true;
    }
}
