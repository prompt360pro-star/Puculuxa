import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Injectable()
export class PdfService {
  generateQuotationPdf(
    quotation: Prisma.QuotationGetPayload<object>,
    res: Response,
  ) {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Stream the PDF to the response
    doc.pipe(res);

    // Header - Logo Placeholder or Brand Name
    doc.fillColor('#E91E63').fontSize(24).text('Puculuxa', { align: 'center' });

    doc
      .fillColor('#444444')
      .fontSize(10)
      .text('Cakes & Catering', { align: 'center' })
      .moveDown(2);

    // Horizontal Line
    doc
      .strokeColor('#EEEEEE')
      .moveTo(50, 100)
      .lineTo(545, 100)
      .stroke()
      .moveDown(2);

    // Quotation Title
    doc
      .fillColor('#333333')
      .fontSize(18)
      .text('Orçamento de Evento', { align: 'left' })
      .moveDown();

    // Details Table Heading
    doc
      .fontSize(12)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .text(`Evento: ${quotation.eventType}`, 50, 160)
      .text(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
        `Data: ${quotation.eventDate ? new Date(quotation.eventDate).toLocaleDateString('pt-BR') : 'A definir'}`,
        50,
        180,
      )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .text(`Nº de Convidados: ${quotation.guestCount}`, 50, 200)
      .moveDown(2);

    // Customer Info
    doc
      .text('Dados do Cliente:', 300, 160)
      .fontSize(10)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .text(`Nome: ${quotation.customerName || 'N/A'}`, 300, 180)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      .text(`Telefone: ${quotation.customerPhone || 'N/A'}`, 300, 200);

    // Table Content
    doc.moveDown(4);

    // Table Header
    const tableTop = 260;
    doc
      .fillColor('#E91E63')
      .fontSize(12)
      .text('Item', 50, tableTop)
      .text('Detalhes', 150, tableTop)
      .text('Total', 480, tableTop, { align: 'right' });

    doc
      .strokeColor('#DDDDDD')
      .moveTo(50, tableTop + 15)
      .lineTo(545, tableTop + 15)
      .stroke();

    // Table Row (Calculated Total)
    doc
      .fillColor('#444444')
      .text('Serviço de Buffet', 50, tableTop + 30)
      .text(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        `${quotation.eventType} para ${quotation.guestCount} pessoas`,
        150,
        tableTop + 30,
      )
      .text(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        `Kz ${quotation.total.toLocaleString('pt-BR')}`,
        480,
        tableTop + 30,
        { align: 'right' },
      );

    // Total
    doc
      .moveDown(4)
      .fillColor('#E91E63')
      .fontSize(16)
      .text(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        `Total do Orçamento: Kz ${quotation.total.toLocaleString('pt-BR')}`,
        { align: 'right' },
      );

    // Footer
    const footerY = doc.page.height - 100;
    doc
      .fontSize(10)
      .fillColor('#888888')
      .text('Obrigado por escolher a Puculuxa!', 50, footerY, {
        align: 'center',
      })
      .text('Este orçamento é válido por 15 dias.', { align: 'center' });

    doc.end();
  }
}
