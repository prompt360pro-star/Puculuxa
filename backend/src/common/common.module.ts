import { Module, Global } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { ImageService } from './image.service';

@Global()
@Module({
  providers: [PdfService, ImageService],
  exports: [PdfService, ImageService],
})
export class CommonModule {}
