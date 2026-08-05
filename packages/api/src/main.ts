import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:4321', 'http://localhost:3000'],
    credentials: true,
  });

  // Enable validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('FirstCrop ERP API')
    .setDescription('Manufacturing ERP API for microbial products')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User management')
    .addTag('products', 'Product catalog')
    .addTag('batches', 'Production batch tracking')
    .addTag('qc', 'Quality control')
    .addTag('inventory', 'Inventory management')
    .addTag('orders', 'Sales order management')
    .addTag('procurement', 'Vendor and purchase order management')
    .addTag('logistics', 'Delivery and shipment tracking')
    .addTag('finance', 'Invoicing and payments')
    .addTag('compliance', 'Certification and compliance management')
    .addTag('parties', 'Customers, vendors, distributors, retailers')
    .addTag('organizations', 'Multi-tenant organization management')
    .addTag('raw-materials', 'Raw material catalog management')
    .addTag('distributors', 'Distributor network and territory management')
    .addTag('activities', 'Activity timeline and audit log')
    .addTag('field-visits', 'Field service and crop advisory visits')
    .addTag('app-settings', 'Organization key-value settings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.API_PORT || 3002;
  await app.listen(port);
  console.log(`🚀 FirstCrop API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();
