import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend access (Updated to allow Expo Go mobile devices on the network)
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Transformation and validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Binding a '0.0.0.0' garante que o node expõe a API não só para localhost mas para fora na rede (Wi-Fi)
  await app.listen(process.env.PORT ?? 4001, '0.0.0.0');
}
void bootstrap();
