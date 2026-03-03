import { Test, TestingModule } from '@nestjs/testing';
import { QuotationService } from './quotation.service';
import { PrismaService } from '../prisma/prisma.service';
import { QuotationStatusGuard } from './quotation-status.guard';
import { QuotationIntelligenceService } from './quotation-intelligence.service';
import { EventReminderService } from './event-reminder.service';
import { PdfService } from '../common/pdf.service';
import { EventsGateway } from '../events/events.gateway';
import { ForbiddenException, BadRequestException } from '@nestjs/common';

const mockPrismaService: any = {
  quotation: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((callback: (tx: any) => Promise<any>) => callback(mockPrismaService)),
};

const mockQuotationStatusGuard = {
  transition: jest.fn(),
  calculateSlaDeadline: jest.fn(),
};

describe('QuotationService - Customer Acceptance', () => {
  let service: QuotationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: QuotationStatusGuard, useValue: mockQuotationStatusGuard },
        { provide: QuotationIntelligenceService, useValue: {} },
        { provide: EventReminderService, useValue: {} },
        { provide: PdfService, useValue: {} },
        { provide: EventsGateway, useValue: { notifyAdmins: jest.fn() } },
      ],
    }).compile();

    service = module.get<QuotationService>(QuotationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow customer to accept own proposal', async () => {
    const mockQuotation = { id: 'q1', customerId: 'c1', status: 'PROPOSAL_SENT' };
    mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);
    mockQuotationStatusGuard.transition.mockResolvedValue({ ...mockQuotation, status: 'ACCEPTED' });

    // Stub push notification
    jest.spyOn(service as any, 'sendStatusPushNotification').mockImplementation(() => { });

    await expect(service.updateStatus('q1', 'ACCEPTED', 'c1', undefined, 'CUSTOMER'))
      .resolves.toEqual({ ...mockQuotation, status: 'ACCEPTED' });
  });

  it('should reject if customer tries to accept proposal of another user', async () => {
    const mockQuotation = { id: 'q1', customerId: 'c1', status: 'PROPOSAL_SENT' };
    mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);

    await expect(service.updateStatus('q1', 'ACCEPTED', 'other_user', undefined, 'CUSTOMER'))
      .rejects.toThrow(ForbiddenException);
  });

  it('should reject if status is not PROPOSAL_SENT', async () => {
    const mockQuotation = { id: 'q1', customerId: 'c1', status: 'DRAFT' };
    mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);

    await expect(service.updateStatus('q1', 'ACCEPTED', 'c1', undefined, 'CUSTOMER'))
      .rejects.toThrow(BadRequestException);
  });

  it('should reject if customer tries different status than ACCEPTED', async () => {
    const mockQuotation = { id: 'q1', customerId: 'c1', status: 'PROPOSAL_SENT' };
    mockPrismaService.quotation.findUnique.mockResolvedValue(mockQuotation);

    await expect(service.updateStatus('q1', 'REJECTED', 'c1', undefined, 'CUSTOMER'))
      .rejects.toThrow(ForbiddenException);
  });
});
