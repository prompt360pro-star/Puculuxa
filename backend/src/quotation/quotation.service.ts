import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as https from 'https';
import { calculateQuotation } from '@puculuxa/shared';
import { PdfService } from '../common/pdf.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import {
  CreateQuotationDto,
  CreateQuotationVersionDto,
} from './dto/create-quotation.dto';
import {
  QuotationStatusGuard,
  QuotationStatus,
  QuotationVersionStatus,
} from './quotation-status.guard';
import { EventReminderService } from './event-reminder.service';

@Injectable()
export class QuotationService {
  constructor(
    private readonly pdfService: PdfService,
    private prisma: PrismaService,
    private events: EventsGateway,
    private statusGuard: QuotationStatusGuard,
    private reminderService: EventReminderService,
  ) { }

  // ─── CREATE (cliente submete orçamento) ───
  async create(data: CreateQuotationDto, userId?: string) {
    // Calcular preço estimado
    const result = calculateQuotation({
      eventType: data.eventType,
      guestCount: data.guestCount,
      complements: data.complements?.map((c) => c.name) || [],
    });

    // Calcular SLA deadline
    const now = new Date();
    const slaDeadline = this.statusGuard.calculateSlaDeadline(data.eventType, now);

    // Criar orçamento + complementos numa transação
    const newQuotation = await this.prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({
        data: {
          eventType: data.eventType,
          guestCount: data.guestCount,
          eventDate: data.date ? new Date(data.date) : null,
          description: data.description || null,
          referenceImage: data.referenceImage || null,
          source: data.source || 'APP',
          status: QuotationStatus.SUBMITTED,
          estimatedTotal: result.total,
          slaDeadline,
          customerName: data.customerName || null,
          customerPhone: data.customerPhone || null,
          customerId: userId || null,
        },
      });

      // Criar complementos como registos relacionais
      if (data.complements && data.complements.length > 0) {
        await tx.quotationComplement.createMany({
          data: data.complements.map((c) => ({
            quotationId: quotation.id,
            name: c.name,
            type: c.type || 'FIXED',
            unitPrice: c.unitPrice,
            quantity: c.quantity || 1,
            subtotal: c.unitPrice * (c.quantity || 1),
          })),
        });
      }

      // Criar versão inicial (v1)
      await tx.quotationVersion.create({
        data: {
          quotationId: quotation.id,
          version: 1,
          price: result.total,
          changedBy: 'SYSTEM',
          changes: 'Orçamento inicial calculado automaticamente.',
          status: QuotationVersionStatus.PENDING,
        },
      });

      // Audit log
      await tx.statusAuditLog.create({
        data: {
          quotationId: quotation.id,
          fromStatus: 'NEW',
          toStatus: QuotationStatus.SUBMITTED,
          changedBy: userId || 'ANONYMOUS',
        },
      });

      return quotation;
    });

    // Notificar admins via WebSocket
    this.events.notifyAdmins('new_quotation', {
      ...newQuotation,
      slaDeadline,
      estimatedTotal: result.total,
    });

    return newQuotation;
  }

  // ─── FIND ALL (admin) ───
  async findAll(page = 1, limit = 20, statusFilter?: string) {
    const skip = (page - 1) * limit;
    const where: any = { deletedAt: null };
    if (statusFilter) where.status = statusFilter;

    const [data, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: true,
          complements: true,
          items: true,
          versions: { orderBy: { version: 'desc' }, take: 1 },
        },
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return {
      data,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  // ─── FIND ONE ───
  async findOne(id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        customer: true,
        complements: true,
        items: true,
        versions: { orderBy: { version: 'asc' } },
        auditLog: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!quotation) throw new NotFoundException(`Orçamento ${id} não encontrado.`);
    return quotation;
  }

  // ─── UPDATE STATUS (com guard + auditoria) ───
  async updateStatus(id: string, status: string, changedBy: string, reason?: string) {
    const updatedQuotation = await this.statusGuard.transition(
      id,
      status as QuotationStatus,
      changedBy,
      reason,
    );

    if (
      ['PROPOSAL_SENT', 'ACCEPTED', 'REJECTED', 'CONVERTED'].includes(status) &&
      updatedQuotation.customerId
    ) {
      this.sendStatusPushNotification(
        updatedQuotation.id,
        status,
        updatedQuotation.customerId,
        reason,
      );
    }

    return updatedQuotation;
  }

  // ─── SEND PROPOSAL (admin envia proposta ao cliente) ───
  async sendProposal(id: string, adminId: string, dto: CreateQuotationVersionDto) {
    const quotation = await this.findOne(id);

    // Marcar versões anteriores como SUPERSEDED
    await this.prisma.quotationVersion.updateMany({
      where: { quotationId: id, status: QuotationVersionStatus.PENDING },
      data: { status: QuotationVersionStatus.SUPERSEDED },
    });

    // Criar nova versão
    const currentVersions = await this.prisma.quotationVersion.count({
      where: { quotationId: id },
    });

    const newVersion = await this.prisma.quotationVersion.create({
      data: {
        quotationId: id,
        version: currentVersions + 1,
        price: dto.price,
        response: dto.response || null,
        changes: dto.changes || null,
        changedBy: 'ADMIN',
        status: QuotationVersionStatus.PENDING,
      },
    });

    // Transição: IN_REVIEW ou NEGOTIATING → PROPOSAL_SENT
    await this.statusGuard.transition(
      id,
      QuotationStatus.PROPOSAL_SENT,
      adminId,
      `Proposta v${newVersion.version} enviada: Kz ${dto.price}`,
    );

    // Notificar admin (live dashboard)
    this.events.notifyAdmins('proposal_sent', {
      quotationId: id,
      version: newVersion.version,
      price: dto.price,
    });

    // Notificar cliente via Push notification
    if (quotation.customerId) {
      this.sendStatusPushNotification(
        id,
        QuotationStatus.PROPOSAL_SENT,
        quotation.customerId,
      );
    }

    return newVersion;
  }

  // ─── CONVERT TO ORDER (orçamento aceite → pedido) ───
  async convertToOrder(id: string, adminId: string) {
    const quotation = await this.findOne(id);

    // Obter preço da última versão aceite
    const latestVersion = quotation.versions?.[quotation.versions.length - 1];
    const finalPrice = latestVersion?.price || quotation.estimatedTotal;

    // Criar Order numa transação
    const order = await this.prisma.$transaction(async (tx) => {
      // Resolve orderUserId: use quotation.customerId, else validate adminId is a real user ID,
      // else fall back to the first ADMIN user in the DB (anonymous/guest quotations)
      let orderUserId = quotation.customerId;
      if (!orderUserId) {
        const adminUser = await tx.user.findFirst({
          where: {
            OR: [
              { id: adminId },
              { role: 'ADMIN' },
            ],
          },
          select: { id: true },
        });
        orderUserId = adminUser?.id || adminId;
      }

      const newOrder = await tx.order.create({
        data: {
          userId: orderUserId,
          total: finalPrice,
          status: 'PENDING',
          ...(quotation.items && quotation.items.length > 0
            ? {
              items: {
                create: quotation.items.map((item) => ({
                  productId: item.productId,
                  name: item.name,
                  price: item.price,
                  quantity: item.quantity,
                })),
              },
            }
            : {}),
        },
        include: { items: true },
      });

      // Marcar orçamento como CONVERTED
      await tx.quotation.update({
        where: { id },
        data: {
          status: QuotationStatus.CONVERTED,
          convertedOrderId: newOrder.id,
        },
      });

      // Audit log
      await tx.statusAuditLog.create({
        data: {
          quotationId: id,
          fromStatus: QuotationStatus.ACCEPTED,
          toStatus: QuotationStatus.CONVERTED,
          changedBy: adminId,
          reason: `Convertido em pedido #${newOrder.id}`,
        },
      });

      return newOrder;
    });

    this.events.notifyAdmins('quotation_converted', { quotationId: id, orderId: order.id });

    // Notificar cliente via Push notification
    if (quotation.customerId) {
      this.sendStatusPushNotification(
        id,
        QuotationStatus.CONVERTED,
        quotation.customerId,
      );
    }

    // Agendar reminder de recompra para o próximo ano
    if (quotation.customerId && quotation.eventDate) {
      const eventLabel = quotation.eventType.charAt(0).toUpperCase() + quotation.eventType.slice(1);
      this.reminderService.scheduleReminderForOrder(
        quotation.customerId,
        `${eventLabel} — recompra`,
        quotation.eventType,
        new Date(quotation.eventDate),
        order.id,
      ).catch(() => { }); // Non-blocking, não falha a conversão
    }

    return order;
  }

  // ─── BLOCKED DATES ───
  async getBlockedDates() {
    const quotations = await this.prisma.quotation.findMany({
      where: {
        status: { in: ['ACCEPTED', 'CONVERTED'] },
        eventDate: { not: null },
        deletedAt: null,
      },
      select: { eventDate: true },
    });

    const dates = quotations
      .map((q) => (q.eventDate ? q.eventDate.toISOString().split('T')[0] : null))
      .filter((d): d is string => d !== null);

    return [...new Set(dates)];
  }

  // ─── KITCHEN CAPACITY ───
  async getKitchenLoad(date: Date): Promise<number> {
    const dateOnly = new Date(date.toISOString().split('T')[0]);
    const capacity = await this.prisma.kitchenCapacity.findUnique({
      where: { date: dateOnly },
    });
    if (!capacity) return 0;
    return capacity.bookedOrders / capacity.maxOrders;
  }

  // ─── BOOK KITCHEN CAPACITY (atomic) ───
  async bookKitchenCapacity(date: Date) {
    const dateOnly = new Date(date.toISOString().split('T')[0]);
    return this.prisma.kitchenCapacity.upsert({
      where: { date: dateOnly },
      create: { date: dateOnly, maxOrders: 5, bookedOrders: 1 },
      update: { bookedOrders: { increment: 1 } },
    });
  }

  // ─── GET BY CUSTOMER (mobile app) ───
  async getByCustomer(customerId: string) {
    return this.prisma.quotation.findMany({
      where: { customerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        complements: true,
        items: true,
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
    });
  }

  // ─── PUSH NOTIFICATION NAS TRANSIÇÕES ───
  private async sendStatusPushNotification(
    quotationId: string,
    newStatus: string,
    customerId: string,
    rejectionReason?: string,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: customerId },
        select: { pushToken: true },
      });

      if (!user || !user.pushToken) return;

      const quotation = await this.prisma.quotation.findUnique({
        where: { id: quotationId },
        select: { eventType: true },
      });

      if (!quotation) return;

      let title = '';
      let body = '';

      switch (newStatus) {
        case QuotationStatus.PROPOSAL_SENT:
          title = '📋 Proposta Pronta!';
          body = `A sua proposta para ${quotation.eventType} está pronta. Abra a app para ver os detalhes e responder.`;
          break;
        case QuotationStatus.ACCEPTED:
          title = '✅ Proposta Aceite!';
          body = `A proposta para ${quotation.eventType} foi confirmada. Estamos a preparar tudo!`;
          break;
        case QuotationStatus.REJECTED:
          title = 'Orçamento Não Aprovado';
          body = `O orçamento para ${quotation.eventType} não foi aprovado. ${rejectionReason || 'Contacte-nos para mais informações.'}`;
          break;
        case QuotationStatus.CONVERTED:
          title = '🎉 Encomenda Confirmada!';
          body = `A encomenda para ${quotation.eventType} está registada! Acompanhe o progresso na app.`;
          break;
        default:
          return;
      }

      const messagePayload = {
        to: user.pushToken,
        sound: 'default',
        title,
        body,
        data: { quotationId, newStatus, screen: 'Tracking' },
      };

      const data = JSON.stringify(messagePayload);
      const options = {
        hostname: 'exp.host',
        port: 443,
        path: '/--/api/v2/push/send',
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', async () => {
          try {
            const parsed = JSON.parse(responseBody);
            if (parsed.data && parsed.data.status === 'error' && parsed.data.details?.error === 'DeviceNotRegistered') {
              await this.prisma.user.update({
                where: { id: customerId },
                data: { pushToken: null },
              });
              Logger.warn(`[Push] Token removido para user ${customerId} (DeviceNotRegistered)`);
            }
          } catch (e) {
            // Ignorar erro de parse da resposta
          }
        });
      });

      req.on('error', (e) => {
        Logger.error(`[Push] Falha ao enviar notificação Expo: ${e.message}`);
      });

      req.write(data);
      req.end();

    } catch (error: any) {
      Logger.error(`[Push] Erro inesperado ao tentar enviar push notification: ${error?.message || error}`);
    }
  }
}
