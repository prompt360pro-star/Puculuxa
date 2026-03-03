import { Module } from '@nestjs/common';
import { AppyPayProvider } from './providers/appypay.provider';
import { PaymentService } from './payment.service';
import { InvoiceService } from './invoice.service';
import { CreditService } from './credit.service';
import { PaymentController } from './payment.controller';
import { WebhookController } from './webhook.controller';
import { InvoiceConfigController } from './invoice-config.controller';
import { CreditController } from './credit.controller';
import { PaymentReminderController } from './payment-reminder.controller';
import { PaymentReminderService } from './payment-reminder.service';
import { PayoutController } from './payout.controller';
import { PayoutService } from './payout.service';
import { PaymentTermsService } from './payment-terms.service';
import { PaymentTermsController } from './payment-terms.controller';
import { FollowUpService } from './followup.service';
import { FollowUpController } from './followup.controller';
import { DatabaseModule } from '../prisma/prisma.module';
import { EventsModule } from '../events/events.module';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';

@Module({
    imports: [DatabaseModule, EventsModule, WhatsAppModule],
    controllers: [PaymentController, WebhookController, InvoiceConfigController, CreditController, PaymentReminderController, PayoutController, PaymentTermsController, FollowUpController],
    providers: [AppyPayProvider, PaymentService, InvoiceService, CreditService, PaymentReminderService, PayoutService, PaymentTermsService, FollowUpService],
    exports: [PaymentService, InvoiceService, CreditService, PaymentReminderService, PayoutService, PaymentTermsService, FollowUpService],
})
export class PaymentModule { }
