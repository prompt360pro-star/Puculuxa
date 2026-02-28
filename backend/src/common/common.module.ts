import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ImageService } from './image.service';
import { PdfService } from './pdf.service';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [ImageService, PdfService, NotificationProcessor],
  exports: [ImageService, PdfService, BullModule],
})
export class CommonModule {}
