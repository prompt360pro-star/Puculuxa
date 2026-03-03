import { Test, TestingModule } from '@nestjs/testing';
import { WhatsAppService } from './whatsapp.service';
import { PrismaService } from '../prisma/prisma.service';

// ─── Prisma mock factory ───────────────────────────────────────────────────
const makePrismaMock = (overrides?: Partial<Record<string, jest.Mock>>) => ({
    whatsAppLog: {
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockImplementation(async (args: any) => ({
            id: 'log-test-id',
            ...args.create,
        })),
        update: jest.fn().mockImplementation(async (args: any) => ({
            id: 'log-test-id',
            ...args.data,
        })),
        ...overrides,
    },
});

describe('WhatsAppService', () => {
    let service: WhatsAppService;
    let prismaMock: ReturnType<typeof makePrismaMock>;

    const buildModule = async (prismaOverrides?: any) => {
        prismaMock = makePrismaMock(prismaOverrides);

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                WhatsAppService,
                { provide: PrismaService, useValue: prismaMock },
            ],
        }).compile();

        service = module.get<WhatsAppService>(WhatsAppService);
    };

    beforeEach(() => {
        // Ensure Meta credentials are not set (dev/test mode)
        delete process.env.WHATSAPP_ACCESS_TOKEN;
        delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // ─── Test 1: SKIPPED when no credentials ─────────────────────────────────
    describe('without credentials', () => {
        it('should return skipped=true and create a SKIPPED log', async () => {
            await buildModule();

            const result = await service.sendTemplateMessage({
                to: '923456789',
                templateName: 'puculuxa_gpo_pending_v1',
                orderId: 'order-abc',
                variables: ['50000', 'INV-001'],
            });

            expect(result.ok).toBe(true);
            expect(result.skipped).toBe(true);
            expect(prismaMock.whatsAppLog.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({
                        status: 'SKIPPED',
                        templateName: 'puculuxa_gpo_pending_v1',
                        recipientPhone: '244923456789', // normalized
                    }),
                }),
            );
        });

        it('should normalize 9XXXXXXXX to 244XXXXXXXXX', async () => {
            await buildModule();
            await service.sendTemplateMessage({
                to: '923000001',
                templateName: 'puculuxa_test',
            });
            expect(prismaMock.whatsAppLog.upsert).toHaveBeenCalledWith(
                expect.objectContaining({
                    create: expect.objectContaining({ recipientPhone: '244923000001' }),
                }),
            );
        });
    });

    // ─── Test 2: Idempotency check ────────────────────────────────────────────
    describe('idempotency', () => {
        it('should return skipped if SENT log already exists for same key', async () => {
            await buildModule({
                findUnique: jest.fn().mockResolvedValue({
                    id: 'existing-log',
                    status: 'SENT',
                    idempotencyKey: 'WA:puculuxa_gpo_pending_v1:order-abc:20260303',
                }),
            });

            const result = await service.sendTemplateMessage({
                to: '923456789',
                templateName: 'puculuxa_gpo_pending_v1',
                orderId: 'order-abc',
            });

            expect(result.skipped).toBe(true);
            expect(result.logId).toBe('existing-log');
            // Should NOT call upsert since cooldown kicked in
            expect(prismaMock.whatsAppLog.upsert).not.toHaveBeenCalled();
        });

        it('should NOT skip if existing log is FAILED', async () => {
            await buildModule({
                findUnique: jest.fn().mockResolvedValue({
                    id: 'failed-log',
                    status: 'FAILED',
                }),
            });

            const result = await service.sendTemplateMessage({
                to: '923456789',
                templateName: 'puculuxa_bank_details_v1',
                orderId: 'order-xyz',
            });

            // No credentials → SKIPPED, but through upsert path (NOT cooldown path)
            expect(result.skipped).toBe(true);
            expect(prismaMock.whatsAppLog.upsert).toHaveBeenCalled();
        });
    });

    // ─── Test 3: buildIdempotencyKey ─────────────────────────────────────────
    describe('buildIdempotencyKey', () => {
        it('should generate deterministic key for day window', () => {
            const key = service.buildIdempotencyKey('order-1', 'puculuxa_gpo_pending_v1', 'day');
            expect(key).toMatch(/^WA:puculuxa_gpo_pending_v1:order-1:\d{8}$/);
        });

        it('should generate key with hour suffix for hour window', () => {
            const key = service.buildIdempotencyKey('order-1', 'puculuxa_gpo_pending_v1', 'hour');
            expect(key).toMatch(/^WA:puculuxa_gpo_pending_v1:order-1:\d{8}H\d{2}$/);
        });

        it('should use NO_ORDER when orderId is null', () => {
            const key = service.buildIdempotencyKey(null, 'puculuxa_gpo_pending_v1');
            expect(key).toContain('NO_ORDER');
        });
    });
});
