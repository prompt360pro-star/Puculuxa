import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PdfService } from '../common/pdf.service';
import type { Response } from 'express';
import { CreateQuotationDto } from './dto/create-quotation.dto';

@Controller('quotations')
export class QuotationController {
  constructor(
    private readonly quotationService: QuotationService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  @UsePipes(new ValidationPipe())
  create(@Body() createQuotationDto: CreateQuotationDto) {
    return this.quotationService.create(createQuotationDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.quotationService.findAll();
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const quotation = await this.quotationService.findOne(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename = orcamento - ${id}.pdf`,
    );
    this.pdfService.generateQuotationPdf(quotation, res);
  }
}
