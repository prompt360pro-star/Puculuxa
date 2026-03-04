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
  ForbiddenException,
} from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationIntelligenceService } from './quotation-intelligence.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { PdfService } from '../common/pdf.service';
import { ImageService } from '../common/image.service';
import type { Response, Request } from 'express';
export interface AuthUser {
    id?: string;
    sub?: string;
    role?: string;
    [key: string]: unknown;
}
export interface AuthRequest extends Request {
    user?: AuthUser;
}
import {
  CreateQuotationDto,
  UpdateQuotationStatusDto,
  CreateQuotationVersionDto,
} from './dto/create-quotation.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Quotations')
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
  @ApiOperation({ summary: 'Submeter novo orçamento' })
  @Post()
  create(@Body() dto: CreateQuotationDto, @Req() req: AuthRequest) {
    const userId = req.user?.id;
    return this.quotationService.create(dto, userId);
  }

  // ─── Listar Todos (Admin, com paginação e filtro) ───
  @ApiOperation({ summary: 'Listar orçamentos (admin)' })
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
  @ApiOperation({ summary: 'Listar orçamentos do cliente autenticado' })
  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyQuotations(@Req() req: AuthRequest) {
    const userId = req.user?.id || req.user?.sub;
    return this.quotationService.getByCustomer(userId as string);
  }

  // ─── Detalhe (Admin / Customer) ───
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const quotation = await this.quotationService.findOne(id);
    const userId = req.user?.id || req.user?.sub;
    const userRole = req.user?.role;
    
    if (userRole === 'CUSTOMER' && quotation?.customerId !== userId) {
      throw new ForbiddenException('Não tem permissão para ver este orçamento');
    }
    return quotation;
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
  @Roles('ADMIN', 'CUSTOMER')
  @Patch(':id/status')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationStatusDto,
    @Req() req: AuthRequest,
  ) {
    const userId = req.user?.id || 'ANONYMOUS';
    const userRole = req.user?.role;
    return this.quotationService.updateStatus(id, dto.status, userId, dto.reason, userRole);
  }

  // ─── Enviar Proposta (Admin cria versão + transição) ───
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/proposal')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  sendProposal(
    @Param('id') id: string,
    @Body() dto: CreateQuotationVersionDto,
    @Req() req: AuthRequest,
  ) {
    const adminId = req.user?.id || 'ADMIN';
    return this.quotationService.sendProposal(id, adminId, dto);
  }

  // ─── Converter em Pedido (Admin) ───
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post(':id/convert')
  convertToOrder(@Param('id') id: string, @Req() req: AuthRequest) {
    const adminId = req.user?.id || 'ADMIN';
    return this.quotationService.convertToOrder(id, adminId);
  }

  // ─── PDF ───
  @UseGuards(JwtAuthGuard)
  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Req() req: AuthRequest, @Res() res: Response) {
    const quotation = await this.quotationService.findOne(id);

    const userRole = req.user?.role;
    const userId = req.user?.id || req.user?.sub;

    if (userRole !== 'ADMIN' && quotation.customerId !== userId) {
      throw new ForbiddenException('Não tem permissão para aceder a este documento.');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=orcamento-${id}.pdf`,
    );
    this.pdfService.generateQuotationPdf(quotation, res);
  }
}
