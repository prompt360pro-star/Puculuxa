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
    doc.pipe(res);

    const primaryColor = '#e11d48'; // Rose 600
    const textDark = '#0f172a'; // Slate 900
    const textMuted = '#64748b'; // Slate 500
    const lineLight = '#e2e8f0'; // Slate 200

    // Header Background
    doc.rect(0, 0, 595, 120).fill('#f8fafc'); // Slate 50

    // Header Text
    doc
      .fillColor(primaryColor)
      .fontSize(28)
      .text('PUCULUXA', 50, 45, { characterSpacing: 2 });
    doc
      .fillColor(textMuted)
      .fontSize(10)
      .text('Cakes & Catering Exclusivo', 50, 75);

    // Document Meta (Right aligned)
    doc
      .fillColor(textDark)
      .fontSize(14)
      .text('ORÇAMENTO', 400, 45, { align: 'right' });
    doc
      .fillColor(textMuted)
      .fontSize(10)
      .text(`Ref: #${quotation.id.slice(0, 8).toUpperCase()}`, 400, 65, {
        align: 'right',
      });
    doc.text(
      `Data: ${new Date(quotation.createdAt).toLocaleDateString('pt-BR')}`,
      400,
      80,
      { align: 'right' },
    );

    doc.moveDown(4);

    // Two Column Layout for Customer / Event Info
    const topY = 160;

    // Left Box - Customer
    doc.rect(50, topY, 230, 90).fillAndStroke('#ffffff', lineLight);
    doc
      .fillColor(primaryColor)
      .fontSize(10)
      .text('DADOS DO CLIENTE', 65, topY + 15);
    doc
      .fillColor(textDark)
      .fontSize(12)
      .text(quotation.customerName || 'Cliente Padrão', 65, topY + 35);
    doc
      .fillColor(textMuted)
      .fontSize(10)
      .text(`Tel: ${quotation.customerPhone || 'N/A'}`, 65, topY + 55);

    // Right Box - Event
    doc.rect(315, topY, 230, 90).fillAndStroke('#ffffff', lineLight);
    doc
      .fillColor(primaryColor)
      .fontSize(10)
      .text('DETALHES DO EVENTO', 330, topY + 15);
    doc
      .fillColor(textDark)
      .fontSize(12)
      .text(quotation.eventType, 330, topY + 35);
    doc
      .fillColor(textMuted)
      .fontSize(10)
      .text(`Convidados: ${quotation.guestCount} pax`, 330, topY + 55);
    doc.text(
      `Data do Evento: ${quotation.eventDate ? new Date(quotation.eventDate).toLocaleDateString('pt-BR') : 'A definir'}`,
      330,
      topY + 70,
    );

    // Items Table Area
    const tableTop = 290;

    // Table Header
    doc.rect(50, tableTop, 495, 30).fill(primaryColor);
    doc.fillColor('#ffffff').fontSize(10);
    doc.text('DESCRIÇÃO', 65, tableTop + 10);
    doc.text('TIPO', 300, tableTop + 10);
    doc.text('VALOR TOTAL', 430, tableTop + 10, { align: 'right', width: 100 });

    // Table Content (Buffet Service)
    const rowY = tableTop + 40;
    doc.fillColor(textDark).fontSize(11);
    doc.text('Serviço Completo de Catering', 65, rowY);
    doc.fillColor(textMuted).fontSize(10);
    doc.text(
      `Menu premium para ${quotation.guestCount} convidados`,
      65,
      rowY + 15,
    );

    doc.fillColor(textDark).fontSize(11);
    doc.text(quotation.eventType, 300, rowY);
    doc.text(
      `Kz ${quotation.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      430,
      rowY,
      { align: 'right', width: 100 },
    );

    // Add extra row for styling line
    doc
      .strokeColor(lineLight)
      .moveTo(50, rowY + 45)
      .lineTo(545, rowY + 45)
      .stroke();

    // Totals Section
    const totalY = rowY + 60;
    doc.fillColor(textDark).fontSize(12).text('Subtotal:', 350, totalY);
    doc.text(
      `Kz ${quotation.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      430,
      totalY,
      { align: 'right', width: 100 },
    );

    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .text('TOTAL:', 350, totalY + 25);
    doc.text(
      `Kz ${quotation.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      430,
      totalY + 25,
      { align: 'right', width: 100 },
    );

    // Footer
    const footerY = doc.page.height - 80;
    doc.rect(0, footerY - 20, 595, 100).fill('#f8fafc');
    doc
      .fillColor(textMuted)
      .fontSize(9)
      .text('Obrigado por escolher a Puculuxa.', 50, footerY, {
        align: 'center',
      });
    doc.text(
      'Este orçamento tem validade de 15 dias a partir da data de emissão.',
      50,
      footerY + 15,
      { align: 'center' },
    );
    doc
      .fillColor(primaryColor)
      .text('www.puculuxa.com | contacto@puculuxa.com', 50, footerY + 30, {
        align: 'center',
      });

    doc.end();
  }
}
