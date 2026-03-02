import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Param,
  Res,
  Req,
  Query,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationIntelligenceService } from './quotation-intelligence.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { PdfService } from '../common/pdf.service';
import { ImageService } from '../common/image.service';
import type { Response, Request } from 'express';
import {
  CreateQuotationDto,
  UpdateQuotationStatusDto,
  CreateQuotationVersionDto,
} from './dto/create-quotation.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('quotations')
export class QuotationController {
  constructor(
    private readonly quotationService: QuotationService,
    private readonly intelligenceService: QuotationIntelligenceService,
    private readonly pdfService: PdfService,
    private readonly imageService: ImageService,
  ) { }

  // ─── Upload Imagem ───
  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = this.imageService.uploadImage(file);
    return { url };
  }

  // ─── Criar Orçamento ───
  @Post()
  create(@Body() dto: CreateQuotationDto, @Req() req: Request) {
    const userId = (req as any).user?.id || null;
    return this.quotationService.create(dto, userId);
  }

  // ─── Listar Todos (Admin, com paginação e filtro) ───
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.quotationService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  // ─── Datas Bloqueadas ───
  @Get('blocked-dates')
  getBlockedDates() {
    return this.quotationService.getBlockedDates();
  }

  // ─── Meus Orçamentos (Mobile) ───
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyQuotations(@Req() req: Request) {
    const userId = (req as any).user?.id || (req as any).user?.sub;
    return this.quotationService.getByCustomer(userId);
  }

  // ─── Detalhe (Admin) ───
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotationService.findOne(id);
  }

  // ─── Admin Brief (Intelligence) ───
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id/brief')
  getBrief(@Param('id') id: string) {
    return this.intelligenceService.generateAdminBrief(id);
  }

  // ─── Actualizar Status (com guard + auditoria) ───
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationStatusDto,
    @Req() req: Request,
  ) {
    const adminId = (req as any).user?.id || 'ADMIN';
    return this.quotationService.updateStatus(id, dto.status, adminId, dto.reason);
  }

  // ─── Enviar Proposta (Admin cria versão + transição) ───
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/proposal')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  sendProposal(
    @Param('id') id: string,
    @Body() dto: CreateQuotationVersionDto,
    @Req() req: Request,
  ) {
    const adminId = (req as any).user?.id || 'ADMIN';
    return this.quotationService.sendProposal(id, adminId, dto);
  }

  // ─── Converter em Pedido (Admin) ───
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/convert')
  convertToOrder(@Param('id') id: string, @Req() req: Request) {
    const adminId = (req as any).user?.id || 'ADMIN';
    return this.quotationService.convertToOrder(id, adminId);
  }

  // ─── PDF ───
  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const quotation = await this.quotationService.findOne(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=orcamento-${id}.pdf`,
    );
    this.pdfService.generateQuotationPdf(quotation, res);
  }
}
