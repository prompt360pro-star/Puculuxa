import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { redisStore } from 'cache-manager-redis-yet';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { QuotationModule } from './quotation/quotation.module';
import { ProductModule } from './product/product.module';
import { OrderModule } from './order/order.module';
import { DatabaseModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { FeedbackModule } from './feedback/feedback.module';
import { EventsModule } from './events/events.module';
import { ChatModule } from './chat/chat.module';
import { HealthModule } from './health/health.module';
import { PaymentModule } from './payment/payment.module';
import { ExportModule } from './exports/export.module';
import { WhatsAppModule } from './whatsapp/whatsapp.module';
import { APP_FILTER } from '@nestjs/core';
import { SentryExceptionFilter } from './common/sentry-exception.filter';

const useRedis = process.env.USE_REDIS === 'true';

const cacheModuleConfig = useRedis
  ? CacheModule.registerAsync({
    isGlobal: true,
    useFactory: async () => ({
      store: await redisStore({
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
        },
      }),
      ttl: 300000,
    }),
  })
  : CacheModule.register({ isGlobal: true, ttl: 300000 }); // In-memory fallback for local dev

const bullModuleConfig = useRedis
  ? [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),
  ]
  : [];

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000,
        limit: 3,
      },
      {
        name: 'medium',
        ttl: 10000,
        limit: 20,
      },
      {
        name: 'long',
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    ...bullModuleConfig,
    cacheModuleConfig,
    DatabaseModule,
    EventsModule,
    QuotationModule,
    ProductModule,
    OrderModule,
    AuthModule,
    CommonModule,
    AnalyticsModule,
    FeedbackModule,
    ChatModule,
    HealthModule,
    PaymentModule,
    ExportModule,
    WhatsAppModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: SentryExceptionFilter,
    },
  ],
})
export class AppModule { }
