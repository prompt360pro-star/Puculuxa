import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import axios from 'axios';

@Injectable()
export class WhatsAppService {
    private readonly logger = new Logger(WhatsAppService.name);
    private readonly GRAPH_URL = 'https://graph.facebook.com/v19.0';
    private readonly DEFAULT_LANG = process.env.WHATSAPP_DEFAULT_LANG || 'pt_PT';

    constructor(private readonly prisma: PrismaService) { }

    /** Normalize phone to E.164 Angolan format */
    private normalizePhone(phone: string): string {
        let clean = phone.replace(/[\s+\-()]/g, '');
        if (/^9\d{8}$/.test(clean)) clean = `244${clean}`;
        return clean;
    }

    /** Build anti-spam idempotency key */
    public buildIdempotencyKey(
        orderId: string | null,
        templateName: string,
        window: 'day' | 'hour' = 'day',
    ): string {
        const now = new Date();
        const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        const suffix = window === 'hour' ? `H${String(now.getHours()).padStart(2, '0')}` : '';
        return `WA:${templateName}:${orderId ?? 'NO_ORDER'}:${date}${suffix}`;
    }

    /** Main Meta Cloud API dispatcher */
    async sendTemplateMessage(params: {
        to: string;
        templateName: string;
        variables?: Array<string | number>;
        languageCode?: string;
        orderId?: string;
        idempotencyKey?: string;
    }): Promise<{ ok: boolean; skipped?: boolean; logId?: string; waMessageId?: string }> {
        const token = process.env.WHATSAPP_ACCESS_TOKEN;
        const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

        const normalizedPhone = this.normalizePhone(params.to);
        const lang = params.languageCode || this.DEFAULT_LANG;
        const cacheKey =
            params.idempotencyKey ||
            this.buildIdempotencyKey(params.orderId || null, params.templateName);

        // 1) Cooldown check
        const existingLog = await this.prisma.whatsAppLog.findUnique({
            where: { idempotencyKey: cacheKey },
        });
        if (existingLog && ['SENT', 'DELIVERED', 'READ'].includes(existingLog.status)) {
            this.logger.log(`[WhatsApp] Cooldown hit for key: ${cacheKey}`);
            return { ok: true, skipped: true, logId: existingLog.id };
        }

        // 2) Graceful no-credentials mode
        if (!token || !phoneId) {
            this.logger.warn('[WhatsApp] Missing credentials — marking as SKIPPED');
            const skippedLog = await this.prisma.whatsAppLog.upsert({
                where: { idempotencyKey: cacheKey },
                update: { status: 'SKIPPED', errorMessage: 'Missing Meta credentials' },
                create: {
                    orderId: params.orderId,
                    recipientPhone: normalizedPhone,
                    templateName: params.templateName,
                    languageCode: lang,
                    status: 'SKIPPED',
                    idempotencyKey: cacheKey,
                    errorMessage: 'Missing Meta credentials',
                    variables: params.variables ?? Prisma.DbNull,
                },
            });
            return { ok: true, skipped: true, logId: skippedLog.id };
        }

        // 3) Create PENDING log (with variables for retry support)
        const pendingLog = await this.prisma.whatsAppLog.upsert({
            where: { idempotencyKey: cacheKey },
            update: { status: 'PENDING', errorMessage: null, variables: params.variables ?? Prisma.DbNull },
            create: {
                orderId: params.orderId,
                recipientPhone: normalizedPhone,
                templateName: params.templateName,
                languageCode: lang,
                status: 'PENDING',
                idempotencyKey: cacheKey,
                variables: params.variables ?? Prisma.DbNull,
            },
        });

        try {
            const payload: any = {
                messaging_product: 'whatsapp',
                to: normalizedPhone, // Changed from Number(dto.phoneNumber) to normalizedPhone as dto is not defined
                type: 'template',
                template: {
                    name: params.templateName,
                    language: { code: lang },
                    components: [],
                },
            };

            if (params.variables && params.variables.length > 0) {
                payload.template.components.push({
                    type: 'body',
                    parameters: params.variables.map((v) => ({ type: 'text', text: String(v) })),
                });
            }

            const res = await axios.post(`${this.GRAPH_URL}/${phoneId}/messages`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const waMessageId: string | undefined = res.data?.messages?.[0]?.id;

            await this.prisma.whatsAppLog.update({
                where: { id: pendingLog.id },
                data: { status: 'SENT', sentAt: new Date(), waMessageId },
            });

            return { ok: true, logId: pendingLog.id, waMessageId };
        } catch (err: unknown) {
            const error = err as Error;
            const errorMsg = (axios.isAxiosError(err) && err.response?.data?.error?.message) || error.message;
            this.logger.error(`[WhatsApp] Failed to send template ${params.templateName} to ${params.to}: ${errorMsg}`);

            await this.prisma.whatsAppLog.update({
                where: { id: pendingLog.id },
                data: {
                    status: 'FAILED',
                    errorMessage: errorMsg,
                },
            });
            return { ok: false, logId: pendingLog.id };
        }
    }

    // ─── Convenience wrappers ─────────────────────────────────────────────────
    sendBankDetails(orderId: string, phone: string, vars: string[]) {
        return this.sendTemplateMessage({ to: phone, orderId, templateName: 'puculuxa_bank_details_v1', variables: vars });
    }

    sendGpoPending(orderId: string, phone: string, vars: string[]) {
        return this.sendTemplateMessage({ to: phone, orderId, templateName: 'puculuxa_gpo_pending_v1', variables: vars });
    }

    sendCreditOverdue(orderId: string, phone: string, vars: string[]) {
        return this.sendTemplateMessage({ to: phone, orderId, templateName: 'puculuxa_credit_overdue_v1', variables: vars });
    }
}
