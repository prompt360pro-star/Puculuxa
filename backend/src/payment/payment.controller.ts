import {
    Controller,
    Post,
    Get,
    Query,
    Body,
    Param,
    Req,
    UseGuards,
    UsePipes,
    ValidationPipe,
    UploadedFile,
    UseInterceptors,
    HttpCode,
    ForbiddenException,
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import type { Request } from 'express';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { PaymentStatus } from '@prisma/client';
import { PaymentService } from './payment.service';

export interface AuthUser {
    id?: string;
    sub?: string;
    role?: string;
    [key: string]: unknown;
}

export interface AuthRequest extends Request {
    user?: AuthUser;
}
import { InvoiceService } from './invoice.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { PUCULUXA_BANK_DETAILS } from './constants/bank-details';
import { PaymentTermsService } from './payment-terms.service';

// ─── DTOs ───
class InitiateGpoDto {
    @IsString() @IsNotEmpty() orderId!: string;
    @IsString() @IsNotEmpty() phoneNumber!: string;
}

class BankTransferDto {
    @IsString() @IsNotEmpty() orderId!: string;
}

class ValidatePaymentDto {
    @IsBoolean() approved!: boolean;
    @IsString() @IsOptional() reason?: string;
}

@Controller('payments')
export class PaymentController {
    private readonly logger = new Logger(PaymentController.name);

    constructor(
        private readonly paymentService: PaymentService,
        private readonly invoiceService: InvoiceService,
        private readonly prisma: PrismaService,
        private readonly events: EventsGateway,
        private readonly paymentTermsService: PaymentTermsService,
    ) { }

    // ─── a0) Resumo Financeiro da Encomenda ───
    @UseGuards(JwtAuthGuard)
    @Get('order/:orderId/summary')
    async getOrderSummary(@Param('orderId') orderId: string, @Req() req: AuthRequest) {
        const userId = req.user?.id || req.user?.sub;
        const userRole = req.user?.role;

        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new NotFoundException(`Order não encontrada`);

        if (userRole === 'CUSTOMER' && order.userId !== userId) {
            throw new ForbiddenException('Não tem permissão para aceder ao sumário financeiro deste pedido');
        }

        return this.paymentTermsService.getOrderPaymentSummary(orderId);
    }

    // ─── a) Iniciar pagamento Multicaixa Express (GPO) ───
    @UseGuards(JwtAuthGuard)
    @Post('initiate-gpo')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async initiateGpo(@Body() dto: InitiateGpoDto, @Req() req: AuthRequest) {
        const userId = req.user?.id || req.user?.sub;
        const userRole = req.user?.role;

        const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
        if (!order) throw new NotFoundException(`Order ${dto.orderId} não encontrada`);

        // CUSTOMER só pode pagar os seus próprios pedidos
        if (userRole === 'CUSTOMER' && order.userId !== userId) {
            throw new ForbiddenException('Não tem permissão para pagar este pedido');
        }

        if (order.financialStatus === 'PAID') {
            throw new BadRequestException('Este pedido já está pago');
        }

        const result = await this.paymentService.initiateGpoPayment(dto.orderId, dto.phoneNumber);

        return {
            payment: result.payment,
            message: 'Confirme o pagamento na app Multicaixa Express',
        };
    }

    // ─── b) Iniciar transferência bancária ───
    @UseGuards(JwtAuthGuard)
    @Post('bank-transfer')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async initiateBankTransfer(@Body() dto: BankTransferDto, @Req() req: AuthRequest) {
        const userId = req.user?.id || req.user?.sub;
        const userRole = req.user?.role;

        const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
        if (!order) throw new NotFoundException(`Order ${dto.orderId} não encontrada`);

        if (userRole === 'CUSTOMER' && order.userId !== userId) {
            throw new ForbiddenException('Não tem permissão para pagar este pedido');
        }

        if (order.financialStatus === 'PAID') {
            throw new BadRequestException('Este pedido já está pago');
        }

        // Criar pagamento com método BANK_TRANSFER e status AWAITING_PROOF (idempotente)
        const payment = await this.paymentService.createBankTransferPayment(dto.orderId, order.total);

        // Atualizar paymentMode na order
        await this.prisma.order.update({
            where: { id: dto.orderId },
            data: { paymentMode: 'BANK_TRANSFER' },
        });

        // Gerar invoice (idempotente)
        const invoice = await this.invoiceService.createInvoice(dto.orderId);

        return {
            payment,
            invoice,
            bankDetails: {
                ...PUCULUXA_BANK_DETAILS,
                reference: payment.merchantRef,
                amount: order.total,
            },
            message: 'Faça a transferência para o IBAN indicado e envie o comprovativo.',
        };
    }

    // ─── c) Upload comprovativo de transferência ───
    @UseGuards(JwtAuthGuard)
    @Post(':id/upload-proof')
    @UseInterceptors(FileInterceptor('file'))
    async uploadProof(
        @Param('id') paymentId: string,
        @UploadedFile() file: Express.Multer.File & { secure_url?: string; path?: string },
        @Req() req: AuthRequest,
    ) {
        const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new NotFoundException(`Payment ${paymentId} não encontrado`);

        const userId = req.user?.id || req.user?.sub;
        const userRole = req.user?.role;

        // Verificar ownership via a order
        if (userRole === 'CUSTOMER') {
            const order = await this.prisma.order.findUnique({ where: { id: payment.orderId } });
            if (!order || order.userId !== userId) {
                throw new ForbiddenException('Não tem permissão para este pagamento');
            }
        }

        if (!file) throw new BadRequestException('Ficheiro de comprovativo obrigatório');

        const proofUrl = file.path || file.secure_url || (file as Express.Multer.File & { filename?: string }).filename || '';

        await this.prisma.payment.update({
            where: { id: paymentId },
            data: { proofUrl, status: PaymentStatus.AWAITING_PROOF },
        });

        // Notificar admin via WebSocket
        this.events.notifyAdmins('payment_proof_uploaded', {
            paymentId,
            orderId: payment.orderId,
            proofUrl,
        });

        this.logger.log(`[Payment] Proof uploaded for payment ${paymentId}`);
        return { message: 'Comprovativo recebido. Aguarde validação pelo admin.' };
    }

    // ─── d) Admin valida pagamento manual ───
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post(':id/validate')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @HttpCode(200)
    async validatePayment(
        @Param('id') paymentId: string,
        @Body() dto: ValidatePaymentDto,
    ) {
        const payment = await this.prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment) throw new NotFoundException(`Payment ${paymentId} não encontrado`);

        if (dto.approved) {
            const updated = await this.paymentService.confirmPayment(paymentId);
            this.logger.log(`[Payment] Admin approved payment ${paymentId}`);
            return updated;
        } else {
            await this.paymentService.failPayment(paymentId, dto.reason);
            this.logger.warn(`[Payment] Admin rejected payment ${paymentId}: ${dto.reason}`);
            return { id: paymentId, status: 'FAILED', reason: dto.reason };
        }
    }

    // ─── e) Listar pagamentos de uma order ───
    @UseGuards(JwtAuthGuard)
    @Get('order/:orderId')
    async getOrderPayments(@Param('orderId') orderId: string, @Req() req: AuthRequest) {
        const userId = req.user?.id || req.user?.sub;
        const userRole = req.user?.role;

        if (userRole === 'CUSTOMER') {
            const order = await this.prisma.order.findUnique({ where: { id: orderId } });
            if (!order || order.userId !== userId) {
                throw new ForbiddenException('Não tem permissão para ver estes pagamentos');
            }
        }

        return this.paymentService.getPaymentsByOrder(orderId);
    }

    // ─── f) Dados bancários públicos ───
    @Get('bank-details')
    getBankDetails() {
        return PUCULUXA_BANK_DETAILS;
    }

    // ─── g) ADMIN: Pagamentos aguardando comprovativo (Paginado) ───
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Get('admin/awaiting-proof')
    async getAwaitingProof(
        @Query('page') page: string = '1',
        @Query('limit') limit: string = '20'
    ) {
        const pageNumber = Math.max(1, parseInt(page, 10));
        const limitNumber = Math.max(1, parseInt(limit, 10));
        const skip = (pageNumber - 1) * limitNumber;

        const [total, payments] = await Promise.all([
            this.prisma.payment.count({
                where: { status: PaymentStatus.AWAITING_PROOF },
            }),
            this.prisma.payment.findMany({
                where: { status: PaymentStatus.AWAITING_PROOF },
                include: {
                    order: {
                        select: {
                            id: true,
                            total: true,
                            createdAt: true,
                            userId: true,
                            user: { select: { name: true } },
                            invoices: {
                                take: 1,
                                orderBy: { createdAt: 'desc' },
                                select: { invoiceNumber: true }
                            }
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNumber,
            })
        ]);

        const data = payments.map((p) => ({
            id: p.id,
            orderId: p.orderId,
            amount: p.amount,
            method: p.method,
            status: p.status,
            proofUrl: p.proofUrl,
            merchantRef: p.merchantRef,
            createdAt: p.createdAt,
            customerName: p.order?.user?.name || null,
            invoiceNumber: p.order?.invoices?.[0]?.invoiceNumber || null,
        }));

        return {
            data,
            meta: {
                total,
                page: pageNumber,
                limit: limitNumber,
                lastPage: Math.max(1, Math.ceil(total / limitNumber))
            }
        };
    }
}
