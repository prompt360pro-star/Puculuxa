import { Test, TestingModule } from '@nestjs/testing';
import { QuotationService } from './quotation.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';
import { PdfService } from '../common/pdf.service';
import { NotFoundException } from '@nestjs/common';
import { calculateQuotation } from '@puculuxa/shared';

jest.mock('@puculuxa/shared', () => ({
  calculateQuotation: jest.fn().mockReturnValue({ total: 15000 }),
}));

describe('QuotationService', () => {
  let service: QuotationService;
  let prisma: PrismaService;
  let events: EventsGateway;

  const mockPrismaService = {
    quotation: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEventsGateway = {
    notifyAdmins: jest.fn(),
  };

  const mockPdfService = {
    generateQuotationPdf: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuotationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventsGateway, useValue: mockEventsGateway },
        { provide: PdfService, useValue: mockPdfService },
      ],
    }).compile();

    service = module.get<QuotationService>(QuotationService);
    prisma = module.get<PrismaService>(PrismaService);
    events = module.get<EventsGateway>(EventsGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create quotation, calculate total, notify admins and return the new quotation', async () => {
      const createDto = {
        eventType: 'BIRTHDAY',
        guestCount: 50,
        customerName: 'Test',
      };
      const createdQuotation = {
        id: '1',
        ...createDto,
        total: 15000,
        status: 'PENDING',
      };

      mockPrismaService.quotation.create.mockResolvedValue(createdQuotation);

      const result = await service.create(createDto);

      expect(result).toEqual(createdQuotation);
      expect(calculateQuotation).toHaveBeenCalledWith({
        eventType: 'BIRTHDAY',
        guestCount: 50,
        complements: [],
      });
      expect(mockPrismaService.quotation.create).toHaveBeenCalled();
      expect(mockEventsGateway.notifyAdmins).toHaveBeenCalledWith(
        'new_quotation',
        createdQuotation,
      );
    });
  });

  describe('findOne', () => {
    it('should return a quotation if found', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue({
        id: '1',
        total: 15000,
      });
      const result = await service.findOne('1');
      expect(result).toEqual({ id: '1', total: 15000 });
    });

    it('should throw NotFoundException if quotation does not exist', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue(null);
      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('should update status calling findOne to verify existence', async () => {
      mockPrismaService.quotation.findUnique.mockResolvedValue({ id: '1' }); // findOne mock
      mockPrismaService.quotation.update.mockResolvedValue({
        id: '1',
        status: 'APPROVED',
      });

      const result = await service.updateStatus('1', 'APPROVED');

      expect(result).toEqual({ id: '1', status: 'APPROVED' });
      expect(mockPrismaService.quotation.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'APPROVED' },
      });
    });
  });
});
