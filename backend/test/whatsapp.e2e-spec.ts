import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * WhatsApp E2E tests — Phase 12A-4
 * 
 * Tests webhook GET verification and POST status callbacks.
 * APP_SECRET is NOT set so signature verification is bypassed (dev mode).
 */
describe('WhatsApp Webhook (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    beforeAll(async () => {
        // Ensure no app secret so signature check is skipped in dev mode
        delete process.env.WHATSAPP_APP_SECRET;
        process.env.WHATSAPP_VERIFY_TOKEN = 'test-verify-token-e2e';

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Mirror main.ts raw body setup
        const bodyParser = await import('body-parser');
        app.use(
            bodyParser.json({
                verify: (req: any, _res: any, buf: Buffer) => {
                    req.rawBody = buf;
                },
            }),
        );

        await app.init();
        prisma = app.get(PrismaService);
    });

    afterAll(async () => {
        await app.close();
    });

    // ─── Test 1: GET /whatsapp/webhook — hub challenge ────────────────────────
    describe('GET /whatsapp/webhook', () => {
        it('should return 200 and echo hub.challenge when token matches', async () => {
            const response = await request(app.getHttpServer())
                .get('/whatsapp/webhook')
                .query({
                    'hub.mode': 'subscribe',
                    'hub.verify_token': 'test-verify-token-e2e',
                    'hub.challenge': 'CHALLENGE_TOKEN_123',
                });

            expect(response.status).toBe(200);
            expect(response.text).toBe('CHALLENGE_TOKEN_123');
        });

        it('should return 403 when token does not match', async () => {
            const response = await request(app.getHttpServer())
                .get('/whatsapp/webhook')
                .query({
                    'hub.mode': 'subscribe',
                    'hub.verify_token': 'wrong-token',
                    'hub.challenge': 'CHALLENGE',
                });

            expect(response.status).toBe(403);
        });
    });

    // ─── Test 2: POST /whatsapp/webhook — status callbacks ───────────────────
    describe('POST /whatsapp/webhook', () => {
        const TEST_WAMID = `wamid.test-e2e-${Date.now()}`;
        let testLogId: string;

        beforeAll(async () => {
            // Seed a WhatsApp log with a known waMessageId
            const log = await (prisma as any).whatsAppLog.create({
                data: {
                    templateName: 'puculuxa_test_e2e',
                    recipientPhone: '244923999999',
                    status: 'SENT',
                    waMessageId: TEST_WAMID,
                    sentAt: new Date(),
                    variables: ['test-var'],
                },
            });
            testLogId = log.id;
        });

        afterAll(async () => {
            // Cleanup seeded log
            await (prisma as any).whatsAppLog.deleteMany({
                where: { templateName: 'puculuxa_test_e2e' },
            });
        });

        it('should always return 200 (always-200 contract)', async () => {
            const response = await request(app.getHttpServer())
                .post('/whatsapp/webhook')
                .send({ object: 'whatsapp_business_account', entry: [] });

            expect(response.status).toBe(200);
            expect(response.text).toBe('EVENT_RECEIVED');
        });

        it('should update log to DELIVERED when status callback received', async () => {
            const payload = {
                object: 'whatsapp_business_account',
                entry: [
                    {
                        changes: [
                            {
                                value: {
                                    statuses: [{ id: TEST_WAMID, status: 'delivered' }],
                                },
                            },
                        ],
                    },
                ],
            };

            const res = await request(app.getHttpServer())
                .post('/whatsapp/webhook')
                .send(payload);

            expect(res.status).toBe(200);

            // Wait for async update to complete
            await new Promise((r) => setTimeout(r, 500));

            const updatedLog = await (prisma as any).whatsAppLog.findUnique({
                where: { id: testLogId },
            });
            expect(updatedLog?.status).toBe('DELIVERED');
            expect(updatedLog?.deliveredAt).not.toBeNull();
        });

        it('should update log to READ when read callback received', async () => {
            const payload = {
                object: 'whatsapp_business_account',
                entry: [
                    {
                        changes: [
                            { value: { statuses: [{ id: TEST_WAMID, status: 'read' }] } },
                        ],
                    },
                ],
            };

            await request(app.getHttpServer()).post('/whatsapp/webhook').send(payload);
            await new Promise((r) => setTimeout(r, 500));

            const updatedLog = await (prisma as any).whatsAppLog.findUnique({
                where: { id: testLogId },
            });
            expect(updatedLog?.status).toBe('READ');
            expect(updatedLog?.readAt).not.toBeNull();
        });
    });
});
