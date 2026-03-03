import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as crypto from 'crypto';
import * as bodyParser from 'body-parser';

describe('Payment E2E (Phase 10E)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authToken: string;
    let customerId: string;
    let orderIdBank: string;
    let orderIdGpo: string;
    let providerRefGpo: string;

    const WEBHOOK_SECRET = 'test_secret';

    beforeAll(async () => {
        process.env.APPYPAY_WEBHOOK_SECRET = WEBHOOK_SECRET;

        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Emular setup do main.ts
        app.use(bodyParser.json({
            verify: (req: any, _res, buf) => {
                req.rawBody = buf;
            }
        }));
        app.useGlobalPipes(new ValidationPipe({ transform: true }));

        await app.init();
        prisma = app.get<PrismaService>(PrismaService);

        // Limpeza inicial base
        await prisma.payment.deleteMany();
        await prisma.invoice.deleteMany();
        await prisma.order.deleteMany();
        await prisma.user.deleteMany({ where: { email: 'e2e-payment@puculuxa.com' } });

        // Criar customer
        const customer = await prisma.user.create({
            data: {
                name: 'E2E Customer',
                email: 'e2e-payment@puculuxa.com',
                password: 'hash',
                role: 'CUSTOMER',
                phone: '923000000',
            },
        });
        customerId = customer.id;

        // Gerar um JWT simples fingindo ser authService
        const resAuth = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'e2e-payment@puculuxa.com', password: 'hash' });

        // Em testes puros podemos burlar injetando o JWT, mas se login não funcionar sem hash real, inserimos token via jwtService
        const jwtService = moduleFixture.get('JwtService');
        authToken = jwtService.sign({ sub: customer.id, email: customer.email, role: customer.role });

        // Criar Orders para os testes
        const order1 = await prisma.order.create({
            data: {
                userId: customer.id,
                total: 10000,
                status: 'CONFIRMED',
                financialStatus: 'UNPAID',
            }
        });
        orderIdBank = order1.id;

        const order2 = await prisma.order.create({
            data: {
                userId: customer.id,
                total: 20000,
                status: 'CONFIRMED',
                financialStatus: 'UNPAID',
            }
        });
        orderIdGpo = order2.id;
    });

    afterAll(async () => {
        // await prisma.payment.deleteMany();
        // await prisma.invoice.deleteMany();
        // await prisma.order.deleteMany({ where: { userId: customerId } });
        // await prisma.user.delete({ where: { id: customerId } });
        await app.close();
    });

    describe('1) Bank Transfer Idempotency', () => {
        it('bank-transfer should be idempotent and return the same payment', async () => {
            // First call
            const res1 = await request(app.getHttpServer())
                .post('/payments/bank-transfer')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ orderId: orderIdBank });

            expect([200, 201]).toContain(res1.status);
            expect(res1.body).toHaveProperty('payment');
            const paymentId1 = res1.body.payment.id;

            // Second call
            const res2 = await request(app.getHttpServer())
                .post('/payments/bank-transfer')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ orderId: orderIdBank });

            expect([200, 201]).toContain(res2.status);
            expect(res2.body.payment.id).toBe(paymentId1); // Must be identical

            // Check DB to guarantee it didn't create 2 payments
            const count = await prisma.payment.count({
                where: { orderId: orderIdBank, method: 'BANK_TRANSFER' }
            });
            expect(count).toBe(1);
        });
    });

    describe('2) Signed Webhook Confirms Payment', () => {
        it('should initiate GPO and create pending payment', async () => {
            const res = await request(app.getHttpServer())
                .post('/payments/initiate-gpo')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ orderId: orderIdGpo, phoneNumber: '923000000' });

            // It mocks the provider since AppyPay is a service. It might return 201.
            expect([200, 201]).toContain(res.status);

            // Get the generated providerRef from DB
            const p = await prisma.payment.findFirst({ where: { orderId: orderIdGpo } });
            expect(p).toBeDefined();
            expect(p?.providerRef).toBeDefined();
            providerRefGpo = p!.providerRef!;
        });

        it('signed webhook should confirm payment and mark order as PAID', async () => {
            const payload = {
                id: providerRefGpo,
                status: 'SUCCESS',
                merchantTransactionId: 'TEST-M-REF',
                amount: 20000,
            };
            const payloadStr = JSON.stringify(payload);
            const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payloadStr).digest('hex');

            const res = await request(app.getHttpServer())
                .post('/payments/webhook/appypay')
                .set('x-appypay-signature', signature)
                .set('Content-Type', 'application/json')
                .send(payloadStr); // Enviar raw JSON string

            expect(res.status).toBe(200);
            expect(res.body.received).toBe(true);

            // DB Validation
            const p = await prisma.payment.findFirst({ where: { providerRef: providerRefGpo } });
            expect(p?.status).toBe('SUCCESS');

            const o = await prisma.order.findUnique({ where: { id: orderIdGpo } });
            expect(o?.financialStatus).toBe('PAID');
        });
    });

    describe('3) Webhook Idempotency', () => {
        it('webhook should be idempotent when sent twice', async () => {
            const payload = {
                id: providerRefGpo,
                status: 'SUCCESS',
                merchantTransactionId: 'TEST-M-REF',
                amount: 20000,
            };
            const payloadStr = JSON.stringify(payload);
            const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payloadStr).digest('hex');

            const res = await request(app.getHttpServer())
                .post('/payments/webhook/appypay')
                .set('x-appypay-signature', signature)
                .set('Content-Type', 'application/json')
                .send(payloadStr);

            expect(res.status).toBe(200);

            // Fetch DB objects to verify no anomalies
            const payments = await prisma.payment.findMany({ where: { providerRef: providerRefGpo } });
            expect(payments.length).toBe(1);
            expect(payments[0].status).toBe('SUCCESS');
        });
    });
});
