import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AppController (e2e) - Quotation Flow', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let adminToken: string;
  let customerToken: string;
  let quotationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transformOptions: { enableImplicitConversion: true } }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Clean DB for the required entities to ensure test isolation
    // (Note: Since we are using the main Prisma module it points to the local Postgres usually, unless overridden)
    await prisma.statusAuditLog.deleteMany();
    await prisma.quotationVersion.deleteMany();
    await prisma.quotationComplement.deleteMany();
    await prisma.quotationItem.deleteMany();
    await prisma.quotation.deleteMany();

    // We clean users that match our test emails to avoid unique constraints, 
    // rather than all users, as seed might have seeded default admin.
    await prisma.user.deleteMany({
      where: { email: { in: ['admin@e2e.com', 'customer@e2e.com'] } }
    });

    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Criar user admin
    await prisma.user.create({
      data: { email: 'admin@e2e.com', password: passwordHash, name: 'Admin E2E', role: 'ADMIN' },
    });

    // 2. Criar user cliente
    await prisma.user.create({
      data: { email: 'customer@e2e.com', password: passwordHash, name: 'Customer E2E', role: 'CUSTOMER' },
    });

    // Login to get tokens
    const adminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@e2e.com', password: 'password123' });
    adminToken = adminRes.body.access_token;

    const customerRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'customer@e2e.com', password: 'password123' });
    customerToken = customerRes.body.access_token;
  });

  afterAll(async () => {
    // Cleanup
    await prisma.statusAuditLog.deleteMany();
    await prisma.quotationVersion.deleteMany();
    await prisma.quotationComplement.deleteMany();
    await prisma.quotationItem.deleteMany();
    await prisma.quotation.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { in: ['admin@e2e.com', 'customer@e2e.com'] } }
    });
    await app.close();
  });

  it('1. Cliente cria quotation', async () => {
    const res = await request(app.getHttpServer())
      .post('/quotations')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        eventType: 'casamento',
        guestCount: 150,
        date: new Date().toISOString(),
      })
      .expect(201);

    quotationId = res.body.id;
    expect(res.body.status).toBe('SUBMITTED');
  });

  it('2. Admin envia proposta', async () => {
    // Force simple bypass in test if state requires different starting point
    // Though FASE 8 expects PROPOSAL_SENT, we might need a price parameter:
    const res = await request(app.getHttpServer())
      .post(`/quotations/${quotationId}/proposal`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        price: 500000,
        changes: 'Test e2e proposal',
      })
      .expect(201);

    // Assumes version starts at 1
    expect(res.body.version).toBe(1);

    const qRes = await request(app.getHttpServer())
      .get(`/quotations/${quotationId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(qRes.body.status).toBe('PROPOSAL_SENT');
  });

  it('3. Cliente aceita', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/quotations/${quotationId}/status`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'ACCEPTED', reason: 'Looks great!' })
      .expect(200);

    expect(res.body.status).toBe('ACCEPTED');
  });

  it('4. Confirmar status final', async () => {
    const res = await request(app.getHttpServer())
      .get(`/quotations/my`)
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(200);

    const quotation = res.body.find((q: any) => q.id === quotationId);
    expect(quotation).toBeDefined();
    expect(quotation.status).toBe('ACCEPTED');
  });
});
