import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable CORS for frontend access (Updated to allow Expo Go mobile devices on the network)
  const allowedOrigins = [
    'http://localhost:3000', // Frontend Web (Local)
    'http://127.0.0.1:3000',
  ];

  app.enableCors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      // Allow requests with no origin (like Mobile Native Apps / Expo or server-to-server)
      // or allowed explicitly local origins
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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
