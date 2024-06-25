import * as express from 'express';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './utils/globalErrorHandler';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT');

  app.enableCors({
    origin: '*',
    credentials: true,
    optionsSuccessStatus: 200,
    methods: 'GET,PATCH,POST,PUT,DELETE',
  });
  app.use(express.json({ limit: 250 << 20 }));
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      transform: true,
      whitelist: true,
    }),
  );

  const swaggerOptions = new DocumentBuilder()
    .setTitle('NBPE')
    .setDescription(
      'Nestjs BoilerPlate with Email and Telegram Notifications',
    )
    .setVersion('1.0.0')
    .addServer(`http://localhost:${port}`, 'Local environment')
    .addBearerAuth(
      { type: 'http', scheme: 'Bearer', bearerFormat: 'JWT' },
      'Authorization',
    )
    .addTag('Server', 'Endpoint for Server functions')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('docs', app, swaggerDocument);

  //await app.listen(3000);

  try {
    await app.listen(port);
    console.log(`http://localhost:${port}`);
  } catch (err) {
    console.error(err.message);
  }
}
bootstrap();
