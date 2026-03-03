import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { FinanceAnalyticsController } from './finance-analytics.controller';
import { FinanceAnalyticsService } from './finance-analytics.service';
import { DatabaseModule } from '../prisma/prisma.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [DatabaseModule, PaymentModule],
  controllers: [AnalyticsController, FinanceAnalyticsController],
  providers: [AnalyticsService, FinanceAnalyticsService],
})
export class AnalyticsModule { }
