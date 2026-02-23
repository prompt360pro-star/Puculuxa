import { Injectable, NotFoundException } from '@nestjs/common';
import { calculateQuotation } from '@puculuxa/shared';
import { PdfService } from '../common/pdf.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuotationDto } from './dto/create-quotation.dto';

@Injectable()
export class QuotationService {
  constructor(
    private readonly pdfService: PdfService,
    private prisma: PrismaService,
  ) {}

  async create(data: CreateQuotationDto) {
    const result = calculateQuotation({
      eventType: data.eventType,
      guestCount: data.guestCount,
      complements: data.complements || [],
    });

    const newQuotation = await this.prisma.quotation.create({
      data: {
        eventType: data.eventType,
        guestCount: data.guestCount,
        eventDate: data.date ? new Date(data.date) : new Date(),
        total: result.total,
        status: 'PENDING',
        customerName: data.customerName || 'Anonymous',
        customerPhone: data.customerPhone || '',
      },
    });

    return newQuotation;
  }

  findAll() {
    return this.prisma.quotation.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
    });

    if (!quotation) {
      throw new NotFoundException(`Quotation with ID ${id} not found`);
    }

    return quotation;
  }
}
