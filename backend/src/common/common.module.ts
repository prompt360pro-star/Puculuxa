import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ImageService } from './image.service';
import { PdfService } from './pdf.service';
import { NotificationProcessor } from './notification.processor';

const useRedis = process.env.USE_REDIS === 'true';

const bullImports = useRedis
  ? [
      BullModule.registerQueue({
        name: 'notifications',
      }),
    ]
  : [];

const bullProviders = useRedis ? [NotificationProcessor] : [];
const bullExports = useRedis ? [BullModule] : [];

@Module({
  imports: [...bullImports],
  providers: [ImageService, PdfService, ...bullProviders],
  exports: [ImageService, PdfService, ...bullExports],
})
export class CommonModule {}
