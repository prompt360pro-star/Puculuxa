import {
    Controller,
    Post,
    Body,
    HttpCode,
    Logger,
    Req,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentService } from './payment.service';
import * as crypto from 'crypto';
import * as Sentry from '@sentry/node';
import type { Request } from 'express';

interface AppyPayWebhookPayload {
    id: string;             // Charge ID do AppyPay (= nosso providerRef)
    status: string;         // 'COMPLETED' | 'PAID' | 'SUCCESS' | 'FAILED' | 'DECLINED' | 'EXPIRED'
    merchantTransactionId: string; // Nosso merchantRef (PUC-{ts}-{rand})
    amount: number;
    reference?: string;
    [key: string]: unknown;     // Campos adicionais para forward-compatibility
}

const SUCCESS_STATUSES = new Set(['COMPLETED', 'PAID', 'SUCCESS', 'APPROVED']);
const FAILURE_STATUSES = new Set(['FAILED', 'DECLINED', 'EXPIRED', 'CANCELLED', 'REJECTED']);

@SkipThrottle()
@Controller('payments/webhook')
export class WebhookController {
    private readonly logger = new Logger(WebhookController.name);

    constructor(private readonly paymentService: PaymentService) { }

    /**
     * POST /payments/webhook/appypay
     *
     * CRITICAL RULES:
     * - Always return HTTP 200 (even on errors) — gateways retry on non-200
     * - Never throw exceptions to the caller
     * - Must be idempotent (handle duplicate webhooks gracefully)
     */
    @Post('appypay')
    @HttpCode(200)
    async handleAppyPayWebhook(@Req() req: Request & { rawBody?: Buffer }, @Body() body: AppyPayWebhookPayload) {

        // --- 1. Signature Validation (Always-200 Approach) ---
        const secret = process.env.APPYPAY_WEBHOOK_SECRET;
        const signature = req.headers['x-appypay-signature'];

        if (!secret) {
            // Se estivermos aqui em PROD, devia ter caído no main.ts, mas por prevenção:
            if (process.env.NODE_ENV === 'production') {
                this.logger.error('[Webhook] FATAL: APPYPAY_WEBHOOK_SECRET is missing. Webhooks are running completely insecure.');
            } else {
                this.logger.warn('[Webhook] APPYPAY_WEBHOOK_SECRET not set — skipping signature check');
            }
        } else {
            if (!signature) {
                this.logger.warn('[Webhook] Missing x-appypay-signature header - payload ignored');
                return { received: true, ignored: true };
            }

            const rawBody = req.rawBody ?? Buffer.from(JSON.stringify(req.body));
            const expected = crypto
                .createHmac('sha256', secret)
                .update(rawBody)
                .digest('hex');

            const sigStr = String(signature).replace(/^sha256=/, '').trim();
            const sigBuf = Buffer.from(sigStr, 'utf8');
            const expBuf = Buffer.from(expected, 'utf8');

            if (sigBuf.length !== expBuf.length) {
                this.logger.warn('[Webhook] Invalid signature length - payload ignored');
                Sentry.captureMessage('[Webhook] Invalid signature length', 'warning');
                return { received: true, ignored: true };
            }

            const isValid = crypto.timingSafeEqual(sigBuf, expBuf);

            if (!isValid) {
                this.logger.warn('[Webhook] Invalid signature - payload ignored', { signature: sigStr });
                Sentry.captureMessage('[Webhook] Invalid signature', 'warning');
                return { received: true, ignored: true };
            }
        }

        const { id, status, merchantTransactionId } = body;

        this.logger.log(`[Webhook] AppyPay received — chargeId: ${id}, status: ${status}, merchantTxId: ${merchantTransactionId}`);

        try {
            // 2. Find payment by providerRef (charge id) or merchantRef
            const payment = await this.paymentService.findByProviderRefOrMerchantRef(id, merchantTransactionId);

            if (!payment) {
                this.logger.warn(`[Webhook] Payment not found for chargeId=${id} / merchantTxId=${merchantTransactionId} — ignoring`);
                return { received: true, ignored: true };
            }

            // 3. Idempotency check — skip if already in a terminal state
            if (payment.status === 'SUCCESS') {
                this.logger.log(`[Webhook] Payment ${payment.id} already confirmed — idempotent skip`);
                return { received: true, ignored: true };
            }

            if (payment.status === 'FAILED') {
                this.logger.log(`[Webhook] Payment ${payment.id} already failed — idempotent skip`);
                return { received: true, ignored: true };
            }

            // 4. Process based on status
            if (SUCCESS_STATUSES.has(status?.toUpperCase())) {
                await this.paymentService.confirmPayment(payment.id, id);
                this.logger.log(`[Webhook] ✅ Payment ${payment.id} confirmed for order ${payment.orderId}`);
            } else if (FAILURE_STATUSES.has(status?.toUpperCase())) {
                await this.paymentService.failPayment(payment.id, status);
                this.logger.warn(`[Webhook] ❌ Payment ${payment.id} failed — status: ${status}`);
            } else {
                // Unknown status — log and ignore (no state change)
                this.logger.warn(`[Webhook] Unknown status '${status}' for payment ${payment.id} — no action taken`);
            }
        } catch (error: unknown) {
            // CRITICAL: Never propagate errors to the gateway — always return 200
            const err = error as Error;
            this.logger.error(`[Webhook] Internal error processing AppyPay webhook: ${err?.message}`, err?.stack);
        }

        return { received: true };
    }
}
