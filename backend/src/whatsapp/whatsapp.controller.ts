import { Controller, Get, Post, Body, Req, Res, Headers, UseGuards, Param, Query, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { WhatsAppService } from './whatsapp.service';

interface RawBodyRequest extends Request {
    rawBody?: Buffer;
}

@Controller('whatsapp')
export class WhatsAppController {
    private readonly logger = new Logger(WhatsAppController.name);
    private readonly VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || '';
    private readonly APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';

    constructor(
        private readonly whatsappService: WhatsAppService,
        private readonly prisma: PrismaService,
    ) { }

    // ─── GET /whatsapp/webhook — Meta verification handshake ─────────────────
    @Get('webhook')
    verifyWebhook(@Req() req: Request, @Res() res: Response): void {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === this.VERIFY_TOKEN) {
            this.logger.log('WhatsApp webhook verification successful');
            res.status(200).send(challenge);
            return;
        }
        res.status(403).send('Forbidden');
    }

    // ─── POST /whatsapp/webhook — Delivery status callbacks ──────────────────
    @Post('webhook')
    async handleWebhook(
        @Req() req: RawBodyRequest,
        @Res() res: Response,
        @Headers('x-hub-signature-256') signature?: string,
    ): Promise<void> {
        // ALWAYS 200 — Meta retries on any non-200
        res.status(200).send('EVENT_RECEIVED');

        // Validate HMAC signature when secret is configured
        if (this.APP_SECRET && req.rawBody) {
            if (!signature) {
                this.logger.warn('[WhatsApp] Webhook received without signature — ignoring');
                return;
            }
            try {
                const hmac = crypto.createHmac('sha256', this.APP_SECRET);
                const digest = Buffer.from('sha256=' + hmac.update(req.rawBody).digest('hex'), 'utf8');
                const checksum = Buffer.from(signature, 'utf8');
                if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
                    this.logger.warn('[WhatsApp] Invalid webhook signature — ignoring');
                    return;
                }
            } catch (e: any) {
                this.logger.error('[WhatsApp] Signature check crashed', e.message);
                return;
            }
        } else if (!this.APP_SECRET) {
            this.logger.warn('[WhatsApp] No APP_SECRET configured — skipping signature check (dev mode)');
        }

        // Process status callbacks
        try {
            const body = req.body as any;
            if (body?.object === 'whatsapp_business_account' && Array.isArray(body.entry)) {
                for (const entry of body.entry) {
                    for (const change of (entry.changes ?? [])) {
                        for (const statusObj of (change?.value?.statuses ?? [])) {
                            const wamid: string | undefined = statusObj.id;
                            const rawStatus: string | undefined = statusObj.status;
                            if (!wamid || !rawStatus) continue;

                            const status = rawStatus.toUpperCase(); // DELIVERED, READ, FAILED

                            const found = await (this.prisma as any).whatsAppLog.findUnique({
                                where: { waMessageId: wamid },
                            });
                            if (!found) {
                                this.logger.verbose(`[WhatsApp] Unknown wamid in webhook: ${wamid}`);
                                continue;
                            }

                            const updateData: Record<string, any> = { status, webhookStatusRaw: statusObj };
                            if (status === 'DELIVERED') updateData.deliveredAt = new Date();
                            if (status === 'READ') updateData.readAt = new Date();
                            if (status === 'FAILED') {
                                updateData.errorMessage = JSON.stringify(statusObj.errors ?? 'FAILED with no details');
                            }

                            await (this.prisma as any).whatsAppLog.update({
                                where: { waMessageId: wamid },
                                data: updateData,
                            });
                        }
                    }
                }
            }
        } catch (err: any) {
            this.logger.error('[WhatsApp] Error processing webhook payload', err.message);
        }
    }

    // ─── GET /whatsapp/logs — History by orderId ──────────────────────────────
    @Get('logs')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async getLogsByOrder(
        @Query('orderId') orderId: string,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ) {
        const take = Number(limit);
        const skip = (Number(page) - 1) * take;
        const [data, total] = await Promise.all([
            (this.prisma as any).whatsAppLog.findMany({
                where: { orderId },
                orderBy: { createdAt: 'desc' },
                take,
                skip,
                select: {
                    id: true,
                    templateName: true,
                    recipientPhone: true,
                    status: true,
                    waMessageId: true,
                    sentAt: true,
                    deliveredAt: true,
                    readAt: true,
                    errorMessage: true,
                    createdAt: true,
                },
            }),
            (this.prisma as any).whatsAppLog.count({ where: { orderId } }),
        ]);
        return { data, meta: { total, page: Number(page), limit: take } };
    }

    // ─── GET /whatsapp/logs/recent — Global recent audit feed ────────────────
    @Get('logs/recent')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async getRecentLogs(
        @Query('page') page = '1',
        @Query('limit') limit = '20',
    ) {
        const take = Number(limit);
        const skip = (Number(page) - 1) * take;
        const [data, total] = await Promise.all([
            (this.prisma as any).whatsAppLog.findMany({
                orderBy: { createdAt: 'desc' },
                take,
                skip,
                select: {
                    id: true,
                    orderId: true,
                    templateName: true,
                    recipientPhone: true,
                    status: true,
                    waMessageId: true,
                    sentAt: true,
                    deliveredAt: true,
                    readAt: true,
                    errorMessage: true,
                    createdAt: true,
                },
            }),
            (this.prisma as any).whatsAppLog.count(),
        ]);
        return { data, meta: { total, page: Number(page), limit: take } };
    }

    // ─── POST /whatsapp/admin/send/:orderId — Manual ADMIN trigger ───────────
    @Post('admin/send/:orderId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async adminSendTemplate(
        @Param('orderId') orderId: string,
        @Body() body: {
            phone: string;
            templateName: string;
            variables?: (string | number)[];
            languageCode?: string;
        },
    ) {
        return this.whatsappService.sendTemplateMessage({
            to: body.phone,
            templateName: body.templateName,
            orderId,
            variables: body.variables,
            languageCode: body.languageCode,
        });
    }

    // ─── POST /whatsapp/admin/retry/:logId — Retry FAILED/SKIPPED log ────────
    @Post('admin/retry/:logId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async retryFailedLog(@Param('logId') logId: string) {
        const log = await (this.prisma as any).whatsAppLog.findUnique({
            where: { id: logId },
        });

        if (!log) {
            return { ok: false, error: 'Log not found' };
        }

        if (!['FAILED', 'SKIPPED'].includes(log.status)) {
            return { ok: false, error: `Cannot retry log with status ${log.status}. Only FAILED/SKIPPED allowed.` };
        }

        if (!log.variables) {
            return {
                ok: false,
                error: 'No variables stored for this log. Use POST /whatsapp/admin/send/:orderId to re-send with explicit payload.',
            };
        }

        // Clear the idempotency key so the service will re-dispatch
        await (this.prisma as any).whatsAppLog.update({
            where: { id: logId },
            data: { idempotencyKey: null, status: 'PENDING', errorMessage: null },
        });

        return this.whatsappService.sendTemplateMessage({
            to: log.recipientPhone,
            templateName: log.templateName,
            orderId: log.orderId ?? undefined,
            variables: Array.isArray(log.variables) ? log.variables : undefined,
            languageCode: log.languageCode,
        });
    }
}
