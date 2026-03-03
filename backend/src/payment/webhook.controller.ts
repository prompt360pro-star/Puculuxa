import {
    Controller,
    Post,
    Body,
    HttpCode,
    Logger,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentService } from './payment.service';
// import { WebhookSignatureGuard } from './guards/webhook.guard';
// TODO: Activar quando tivermos APPYPAY_WEBHOOK_SECRET confirmado:
// @UseGuards(WebhookSignatureGuard)

/**
 * AppyPay Webhook Payload (estrutura esperada)
 * Verificar documentação: appypay.stoplight.io
 */
interface AppyPayWebhookPayload {
    id: string;             // Charge ID do AppyPay (= nosso providerRef)
    status: string;         // 'COMPLETED' | 'PAID' | 'SUCCESS' | 'FAILED' | 'DECLINED' | 'EXPIRED'
    merchantTransactionId: string; // Nosso merchantRef (PUC-{ts}-{rand})
    amount: number;
    reference?: string;
    [key: string]: any;     // Campos adicionais para forward-compatibility
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
    async handleAppyPayWebhook(@Body() body: AppyPayWebhookPayload) {
        const { id, status, merchantTransactionId } = body;

        this.logger.log(`[Webhook] AppyPay received — chargeId: ${id}, status: ${status}, merchantTxId: ${merchantTransactionId}`);

        try {
            // 1. Find payment by providerRef (charge id) or merchantRef
            const payment = await this.paymentService.findByProviderRefOrMerchantRef(id, merchantTransactionId);

            if (!payment) {
                this.logger.warn(`[Webhook] Payment not found for chargeId=${id} / merchantTxId=${merchantTransactionId} — ignoring`);
                return { received: true };
            }

            // 2. Idempotency check — skip if already in a terminal state
            if (payment.status === 'SUCCESS') {
                this.logger.log(`[Webhook] Payment ${payment.id} already confirmed — idempotent skip`);
                return { received: true };
            }

            if (payment.status === 'FAILED') {
                this.logger.log(`[Webhook] Payment ${payment.id} already failed — idempotent skip`);
                return { received: true };
            }

            // 3. Process based on status
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
        } catch (error: any) {
            // CRITICAL: Never propagate errors to the gateway — always return 200
            this.logger.error(`[Webhook] Internal error processing AppyPay webhook: ${error?.message}`, error?.stack);
        }

        return { received: true };
    }
}
