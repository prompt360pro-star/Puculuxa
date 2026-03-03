import {
    Controller,
    Get,
    Put,
    Body,
    Query,
    UseGuards,
    UsePipes,
    ValidationPipe,
    ConflictException,
    Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { IsString, IsOptional, IsInt, Min, Max, Matches, Length, ValidateIf } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { InvoiceService } from './invoice.service';

// ─── DTO ───
class UpdateInvoiceConfigDto {
    @IsString()
    @Matches(/^[A-Z]+$/, { message: 'O prefixo deve conter apenas letras maiúsculas' })
    @Length(1, 5)
    prefix!: string;

    @IsOptional()
    @IsInt()
    @Min(2020)
    @Max(2100)
    year?: number;

    @IsOptional()
    @IsInt()
    @Min(1)
    nextNumber?: number;

    @IsOptional()
    @IsInt()
    @Min(3)
    @Max(8)
    padding?: number;

    @IsOptional()
    @IsString()
    @ValidateIf((o) => o.format !== undefined)
    format?: string;
}

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class InvoiceConfigController {
    private readonly logger = new Logger(InvoiceConfigController.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly invoiceService: InvoiceService,
    ) { }

    // ─── a) GET /invoices/config — Ver config actual + preview ───
    @Get('config')
    async getConfig(
        @Query('prefix') prefix = 'PF',
        @Query('year') yearStr?: string,
    ) {
        const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();

        const config = await this.prisma.invoiceConfig.findUnique({
            where: { prefix_year: { prefix, year } },
        });

        const defaults = {
            prefix,
            year,
            nextNumber: 1,
            padding: 5,
            format: '{prefix} {year}/{number}',
        };

        const preview = await this.invoiceService.previewNextNumber(prefix, year);

        return {
            config: config ?? null,
            defaults,
            preview,
        };
    }

    // ─── b) PUT /invoices/config — Atualizar config de numeração ───
    @Put('config')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    async updateConfig(@Body() dto: UpdateInvoiceConfigDto) {
        const year = dto.year ?? new Date().getFullYear();

        // Validar que format contém {number}
        if (dto.format && !dto.format.includes('{number}')) {
            throw new ConflictException('O formato deve conter {number}');
        }

        // Se nextNumber explícito, verificar que não colide com invoice existente
        if (dto.nextNumber) {
            const existing = await this.prisma.invoiceConfig.findUnique({
                where: { prefix_year: { prefix: dto.prefix, year } },
            });

            const padding = dto.padding ?? existing?.padding ?? 5;
            const format = dto.format ?? existing?.format ?? '{prefix} {year}/{number}';
            const paddedSeq = String(dto.nextNumber).padStart(padding, '0');
            const testNumber = format
                .replace('{prefix}', dto.prefix)
                .replace('{year}', String(year))
                .replace('{number}', paddedSeq);

            const collision = await this.prisma.invoice.findUnique({
                where: { invoiceNumber: testNumber },
            });

            if (collision) {
                throw new ConflictException(
                    `O número "${testNumber}" já existe. Escolha outro nextNumber.`,
                );
            }
        }

        const config = await this.prisma.invoiceConfig.upsert({
            where: { prefix_year: { prefix: dto.prefix, year } },
            create: {
                prefix: dto.prefix,
                year,
                nextNumber: dto.nextNumber ?? 1,
                padding: dto.padding ?? 5,
                format: dto.format ?? '{prefix} {year}/{number}',
            },
            update: {
                ...(dto.nextNumber !== undefined ? { nextNumber: dto.nextNumber } : {}),
                ...(dto.padding !== undefined ? { padding: dto.padding } : {}),
                ...(dto.format !== undefined ? { format: dto.format } : {}),
            },
        });

        const preview = await this.invoiceService.previewNextNumber(dto.prefix, year);

        this.logger.log(`[InvoiceConfig] Updated: ${dto.prefix}/${year} → next: ${config.nextNumber}, format: ${config.format}`);
        return { config, preview };
    }

    // ─── c) GET /invoices/preview — Preview sem incrementar ───
    @Get('preview')
    async preview(
        @Query('prefix') prefix = 'PF',
        @Query('year') yearStr?: string,
    ) {
        const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
        const nextDocument = await this.invoiceService.previewNextNumber(prefix, year);
        return { nextDocument };
    }
}
