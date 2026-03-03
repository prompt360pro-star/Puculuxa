import { Module } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { WhatsAppController } from './whatsapp.controller';
import { WhatsAppAnalyticsController } from './whatsapp-analytics.controller';

// PrismaService is globally provided via DatabaseModule (@Global)
@Module({
    providers: [WhatsAppService],
    controllers: [WhatsAppController, WhatsAppAnalyticsController],
    exports: [WhatsAppService],
})
export class WhatsAppModule { }
