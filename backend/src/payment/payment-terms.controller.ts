import { Controller, Get, Post, Put, Body, UseGuards, Param, Query, BadRequestException, Req } from '@nestjs/common';
import { PaymentTermsService, OverrideTermsDto } from './payment-terms.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('finance/terms-config')
export class PaymentTermsController {
    constructor(
        private readonly paymentTermsService: PaymentTermsService,
        private readonly prisma: PrismaService
    ) { }

    // ─── ADMIN: Consultar configuração ───
    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async getConfig(
        @Query('segment') segment: string,
        @Query('eventType') eventType?: string
    ) {
        if (!segment) {
            throw new BadRequestException('Parâmetro segment inválido (B2C, B2B, GOVERNMENT)');
        }
        return this.paymentTermsService.resolveConfig(segment as any, eventType);
    }

    // ─── ADMIN: Actualizar configuração (Upsert) ───
    @Put()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async upsertConfig(@Body() body: any) {
        const { segment, eventType, ...data } = body;

        if (!segment) {
            throw new BadRequestException('Segmento inválido');
        }

        const eType = eventType || null;

        // Prisma Upsert with composite null string workaround
        const updated = await (this.prisma as any).paymentTermsConfig.upsert({
            where: {
                segment_eventType: {
                    segment: segment as any,
                    eventType: eType,
                },
            },
            update: {
                depositPercent: data.depositPercent ?? 50,
                depositDueDays: data.depositDueDays ?? 1,
                balanceDueDays: data.balanceDueDays ?? 3,
                creditDueDays: data.creditDueDays ?? 60,
                allowGpo: data.allowGpo ?? true,
                allowBankTransfer: data.allowBankTransfer ?? true,
                allowCredit: data.allowCredit ?? false,
            },
            create: {
                segment: segment as any,
                eventType: eType,
                depositPercent: data.depositPercent ?? 50,
                depositDueDays: data.depositDueDays ?? 1,
                balanceDueDays: data.balanceDueDays ?? 3,
                creditDueDays: data.creditDueDays ?? 60,
                allowGpo: data.allowGpo ?? true,
                allowBankTransfer: data.allowBankTransfer ?? true,
                allowCredit: data.allowCredit ?? false,
            },
        });

        return updated;
    }

    // ─── ADMIN: Forçar/Aplicar regras a uma Order existente ───
    @Post('orders/:orderId/apply')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async applyTermsToOrder(
        @Param('orderId') orderId: string,
        @Body() dto: OverrideTermsDto,
        @Req() req: Request
    ) {
        const adminId = (req as any).user?.id || 'ADMIN';
        return this.paymentTermsService.applyTermsToOrder(orderId, adminId, dto);
    }
}
