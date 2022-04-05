import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

const env = process.env.NODE_ENV || 'production';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));
  app.enableCors();

  if (env === 'development') {
    const options = new DocumentBuilder()
      .setTitle('Cookbook')
      .setDescription('The Cookbook API')
      .setVersion('1.0.0')
      .addServer('api')
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('/swagger', app, document);
  }

  console.log(
    `Listening on port ${process.env.API_PORT} in environment ${env}`,
  );
  await app.listen(process.env.API_PORT);
}
bootstrap();
