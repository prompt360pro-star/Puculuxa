import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../events/events.gateway';

describe('OrderService', () => {
  let service: OrderService;
  let prisma: PrismaService;

  const mockPrismaService = {
    order: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEventsGateway = {
    notifyAdmins: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EventsGateway, useValue: mockEventsGateway },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return paginated orders and meta info', async () => {
      const orders = [
        { id: '1', total: 100 },
        { id: '2', total: 200 },
      ];
      mockPrismaService.order.findMany.mockResolvedValue(orders);
      mockPrismaService.order.count.mockResolvedValue(2);

      const result = await service.findAll(1, 10);

      expect(result).toEqual({
        data: orders,
        meta: {
          total: 2,
          page: 1,
          limit: 10,
          lastPage: 1,
        },
      });
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: true, items: true },
      });
    });
  });

  describe('findMyOrders', () => {
    it('should return orders for a specific user', async () => {
      const orders = [{ id: '1', userId: 'user1' }];
      mockPrismaService.order.findMany.mockResolvedValue(orders);

      const result = await service.findMyOrders('user1');

      expect(result).toEqual(orders);
      expect(mockPrismaService.order.findMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update order status and return the updated order', async () => {
      const updatedOrder = { id: '1', status: 'PRODUCING' };
      mockPrismaService.order.update.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus('1', 'PRODUCING');

      expect(result).toEqual(updatedOrder);
      expect(mockPrismaService.order.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { status: 'PRODUCING' },
        include: { user: true },
      });
    });
  });
});
