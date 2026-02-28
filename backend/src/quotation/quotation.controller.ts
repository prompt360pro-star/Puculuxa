import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  Param,
  Res,
  UsePipes,
  ValidationPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { PdfService } from '../common/pdf.service';
import { ImageService } from '../common/image.service';
import type { Response } from 'express';
import { CreateQuotationDto } from './dto/create-quotation.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('quotations')
export class QuotationController {
  constructor(
    private readonly quotationService: QuotationService,
    private readonly pdfService: PdfService,
    private readonly imageService: ImageService,
  ) { }

  @UseGuards(JwtAuthGuard)
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = this.imageService.uploadImage(file);
    return { url };
  }

  @Post()
  @UsePipes(new ValidationPipe())
  create(@Body() createQuotationDto: CreateQuotationDto) {
    return this.quotationService.create(createQuotationDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.quotationService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') string: string) {
    return this.quotationService.updateStatus(id, string);
  }

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
