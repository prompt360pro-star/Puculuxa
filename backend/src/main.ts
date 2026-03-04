import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/global-exception.filter';
import * as bodyParser from 'body-parser';
import type { IncomingMessage } from 'http';

import helmet from 'helmet';
import { initSentry } from './common/sentry.config';

initSentry();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if (process.env.NODE_ENV === 'production') {
    app.useLogger(['error', 'warn', 'log']);

    if (!process.env.APPYPAY_WEBHOOK_SECRET) {
      console.error('FATAL LOG: APPYPAY_WEBHOOK_SECRET is required in production environments to secure webhooks.');
      process.exit(1);
    }

    if (!process.env.WHATSAPP_VERIFY_TOKEN) {
      console.error('FATAL LOG: WHATSAPP_VERIFY_TOKEN is missing. Meta webhooks will fail verification.');
    }

    if (!process.env.WHATSAPP_APP_SECRET) {
      console.error('FATAL LOG: WHATSAPP_APP_SECRET is missing. Cannot verify webhook signatures.');
    }
  }

  app.use(helmet());

  app.useGlobalFilters(new GlobalExceptionFilter());

  app.enableCors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Capture raw body for webhook signature verification
  app.use(bodyParser.json({
    verify: (req: IncomingMessage & { rawBody?: Buffer }, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  // Transformation and validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');

    const config = new DocumentBuilder()
      .setTitle('Puculuxa API')
      .setDescription('Sistema Operacional de Encomendas Inteligentes')
      .setVersion('1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    console.log('[Swagger] Docs available at /api/docs');
  }

  // Binding a '0.0.0.0' garante que o node expõe a API não só para localhost mas para fora na rede (Wi-Fi)
  await app.listen(process.env.PORT ?? 4001, '0.0.0.0');
}
void bootstrap();
