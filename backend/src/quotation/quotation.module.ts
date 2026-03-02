import { Module } from '@nestjs/common';
import { QuotationService } from './quotation.service';
import { QuotationController } from './quotation.controller';
import { QuotationStatusGuard } from './quotation-status.guard';
import { CommonModule } from '../common/common.module';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [CommonModule, EventsModule],
  controllers: [QuotationController],
  providers: [QuotationService, QuotationStatusGuard],
  exports: [QuotationService, QuotationStatusGuard],
})
export class QuotationModule { }
