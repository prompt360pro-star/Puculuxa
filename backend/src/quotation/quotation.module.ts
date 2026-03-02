import { Module } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationController } from './quotation.controller';
import { QuotationStatusGuard } from './quotation-status.guard';
import { QuotationIntelligenceService } from './quotation-intelligence.service';
import { CommonModule } from '../common/common.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [CommonModule, EventsModule],
  controllers: [QuotationController],
  providers: [QuotationService, QuotationStatusGuard, QuotationIntelligenceService],
  exports: [QuotationService, QuotationStatusGuard, QuotationIntelligenceService],
})
export class QuotationModule { }
