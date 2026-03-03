import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Injectable()
export class PdfService {
  generateQuotationPdf(
    quotation: any, // using any to bypass strict type checking for joined relations like items/complements
    res: Response,
  ) {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      doc.pipe(res);

      const primaryColor = '#dc2626'; // Red Puculuxa
      const accentColor = '#C6A75E'; // Dourado
      const textDark = '#0f172a'; // Slate 900
      const textMuted = '#64748b'; // Slate 500
      const lineLight = '#e2e8f0'; // Slate 200

      // --- HEADER ---
      // Placeholder Título Textual Grande
      doc
        .fillColor(primaryColor)
        .fontSize(32)
        .font('Helvetica-Bold')
        .text('PUCULUXA', 50, 50, { characterSpacing: 2 });

      // Linha separadora dourada
      doc.moveTo(50, 95).lineTo(545, 95).lineWidth(2).stroke(accentColor);

      doc
        .fillColor(textDark)
        .fontSize(16)
        .text('PROPOSTA DE ORÇAMENTO', 50, 115);

      doc
        .fillColor(textMuted)
        .fontSize(10)
        .font('Helvetica')
        .text(`Ref: #${quotation.id.slice(0, 8).toUpperCase()} | Data: ${new Date().toLocaleDateString('pt-BR')}`, 50, 135);

      // --- CLIENTE & EVENTO ---
      const topY = 170;

      // Box Cliente
      doc.rect(50, topY, 230, 90).fillAndStroke('#ffffff', lineLight);
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('DADOS DO CLIENTE', 65, topY + 15);
      doc.fillColor(textDark).fontSize(12).text(quotation.customerName || 'Cliente (Não Especificado)', 65, topY + 35);
      doc.fillColor(textMuted).fontSize(10).font('Helvetica').text(`Tel: ${quotation.customerPhone || 'N/A'}`, 65, topY + 55);

      // Box Evento
      doc.rect(315, topY, 230, 90).fillAndStroke('#ffffff', lineLight);
      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('DETALHES DO EVENTO', 330, topY + 15);
      doc.fillColor(textDark).fontSize(12).text(quotation.eventType.toUpperCase(), 330, topY + 35);
      doc.fillColor(textMuted).fontSize(10).font('Helvetica').text(`Convidados: ${quotation.guestCount} pax`, 330, topY + 55);
      doc.text(`Data do Evento: ${quotation.eventDate ? new Date(quotation.eventDate).toLocaleDateString('pt-BR') : 'A definir'}`, 330, topY + 70);

      // --- DETALHES (Tabela) ---
      let currentY = 290;
      doc.rect(50, currentY, 495, 30).fill(primaryColor);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
      doc.text('DESCRIÇÃO', 65, currentY + 10);
      doc.text('TIPO', 300, currentY + 10);
      doc.text('QTD', 380, currentY + 10, { width: 30, align: 'center' });
      doc.text('SUBTOTAL', 430, currentY + 10, { align: 'right', width: 100 });

      currentY += 40;
      doc.font('Helvetica');

      const items = quotation.complements || [];

      if (items.length > 0) {
        items.forEach((item: any) => {
          doc.fillColor(textDark).fontSize(11).text(item.name, 65, currentY, { width: 220 });
          doc.fillColor(textMuted).fontSize(10).text(item.type || '-', 300, currentY);
          doc.text(String(item.quantity || 1), 380, currentY, { width: 30, align: 'center' });

          const subtotalText = item.subtotal ? `Kz ${Number(item.subtotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-';
          doc.fillColor(textDark).text(subtotalText, 430, currentY, { align: 'right', width: 100 });

          currentY += 30;
          doc.moveTo(50, currentY - 10).lineTo(545, currentY - 10).lineWidth(1).stroke(lineLight);
        });
      } else {
        doc.fillColor(textMuted).fontSize(10).text('Sem complementos adicionais.', 65, currentY);
        currentY += 30;
        doc.moveTo(50, currentY - 10).lineTo(545, currentY - 10).lineWidth(1).stroke(lineLight);
      }

      currentY += 10;

      // Obtém o preço base fixo ou da versão se existir
      const latestVersion = quotation.versions?.[quotation.versions.length - 1];
      const finalPrice = latestVersion?.price || quotation.estimatedTotal;

      doc.fillColor(textDark).fontSize(12).font('Helvetica-Bold').text('Total Base Estimado:', 250, currentY);
      doc.text(`Kz ${(quotation.estimatedTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 430, currentY, { align: 'right', width: 100 });

      currentY += 25;

      // DESTAQUE TOTAL FINAL
      doc.rect(250, currentY - 5, 295, 40).fill('#fef2f2'); // Red 50 background
      doc.fillColor(primaryColor).fontSize(16).font('Helvetica-Bold').text('VALOR TOTAL (Proposta):', 260, currentY + 5);
      doc.text(`Kz ${Number(finalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 420, currentY + 5, { align: 'right', width: 115 });

      // --- RODAPÉ ---
      const footerY = doc.page.height - 120;

      doc.lineWidth(1).moveTo(50, footerY - 20).lineTo(545, footerY - 20).stroke(lineLight);

      doc.fillColor(textDark).fontSize(10).font('Helvetica-Bold').text('Condições da Proposta:', 50, footerY - 5);
      doc.fillColor(textMuted).fontSize(9).font('Helvetica');
      doc.text('• Validade da proposta: 7 dias a partir da presente data.', 50, footerY + 10);
      doc.text('• O pagamento final carece de verificação via App/Comprovativo.', 50, footerY + 25);

      doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('Obrigado por escolher a Puculuxa.', 50, footerY + 50, { align: 'center' });

      // Assinatura digital textual algures na direita
      doc.fillColor(accentColor).fontSize(12).font('Times-Italic').text('Assinatura Digital - Puculuxa Catering', 350, footerY + 30, { align: 'right' });
      doc.fillColor(textMuted).fontSize(8).font('Helvetica').text(`Emitido em: ${new Date().toLocaleString('pt-BR')}`, 350, footerY + 45, { align: 'right' });

      doc.end();
    } catch (error) {
      console.error('[PdfService] Erro a gerar PDF:', error);
      res.status(500).send('Erro interno ao gerar o documento PDF da proposta.');
    }
  }
}
