import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { MulterModule } from '@nestjs/platform-express';
import { ImageService } from '../common/image.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [
    CommonModule,
    MulterModule.registerAsync({
      imports: [CommonModule],
      useFactory: (imageService: ImageService) => ({
        storage: imageService.getStorage(),
      }),
      inject: [ImageService],
    }),
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
