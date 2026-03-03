import { Module } from '@nestjs/common';
import { AppyPayProvider } from './providers/appypay.provider';
import { PaymentService } from './payment.service';
import { InvoiceService } from './invoice.service';
import { CreditService } from './credit.service';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { InvoiceConfigController } from './invoice-config.controller';
import { CreditController } from './credit.controller';
import { DatabaseModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';

@Module({
    imports: [DatabaseModule, EventsModule],
    controllers: [PaymentController, WebhookController, InvoiceConfigController, CreditController],
    providers: [AppyPayProvider, PaymentService, InvoiceService, CreditService],
    exports: [PaymentService, InvoiceService, CreditService],
})
export class PaymentModule { }
