import {
    Controller,
    Post,
    Get,
    Body,
    Param,
    UseGuards,
    UsePipes,
    ValidationPipe,
    Req,
    Logger,
    HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { IsString, IsOptional, IsDateString } from 'class-validator';
import type { Request } from 'express';
import { CreditService } from './credit.service';

// ─── DTOs ───
class ApproveCreditBodyDto {
    @IsDateString()
    creditDueDate!: string;

    @IsOptional() @IsString()
    debtorEntityName?: string;

    @IsOptional() @IsString()
    debtorEntityNif?: string;

    @IsOptional() @IsString()
    debtorProcessRef?: string;

    @IsOptional() @IsString()
    creditNotes?: string;
}

class MarkPaidBodyDto {
    @IsOptional() @IsString()
    reason?: string;
}

@Controller('credits')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CreditController {
    private readonly logger = new Logger(CreditController.name);

    constructor(private readonly creditService: CreditService) { }

    // ─── a) POST /credits/:orderId/approve ───
    @Post(':orderId/approve')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async approveCredit(
        @Param('orderId') orderId: string,
        @Body() dto: ApproveCreditBodyDto,
        @Req() req: Request,
    ) {
        const adminId = (req as any).user?.id || (req as any).user?.sub;

        const result = await this.creditService.markOrderAsCredit(orderId, adminId, {
            creditDueDate: new Date(dto.creditDueDate),
            debtorEntityName: dto.debtorEntityName,
            debtorEntityNif: dto.debtorEntityNif,
            debtorProcessRef: dto.debtorProcessRef,
            creditNotes: dto.creditNotes,
        });

        this.logger.log(`[CreditController] Order ${orderId} approved as IN_CREDIT by admin ${adminId}`);

        return {
            order: result.order,
            invoiceNumber: result.invoice.invoiceNumber,
            dueDate: result.order.creditDueDate,
            message: `Crédito institucional aprovado. Documento: ${result.invoice.invoiceNumber}`,
        };
    }

    // ─── b) POST /credits/:orderId/mark-paid ───
    @Post(':orderId/mark-paid')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    @HttpCode(200)
    async markPaid(
        @Param('orderId') orderId: string,
        @Body() dto: MarkPaidBodyDto,
        @Req() req: Request,
    ) {
        const adminId = (req as any).user?.id || (req as any).user?.sub;

        const order = await this.creditService.markCreditAsPaid(orderId, adminId, dto.reason);

        this.logger.log(`[CreditController] Order ${orderId} credit liquidated by admin ${adminId}`);

        return {
            order,
            message: 'Crédito marcado como pago. Registo contabilístico criado.',
        };
    }

    // ─── c) GET /credits/overdue ───
    @Get('overdue')
    async getOverdue() {
        return this.creditService.getOverdueOrders();
    }

    // ─── d) POST /credits/refresh-overdue ───
    @Post('refresh-overdue')
    @HttpCode(200)
    async refreshOverdue() {
        const updatedCount = await this.creditService.refreshOverdueStatuses();
        return {
            updatedCount,
            message: updatedCount > 0
                ? `${updatedCount} encomenda(s) marcada(s) como OVERDUE`
                : 'Nenhuma encomenda em atraso detectada',
        };
    }
}
