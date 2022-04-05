import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as express from 'express';
import { AppModule } from './app.module';

const env = process.env.NODE_ENV || 'production';

async function bootstrap() {
  const server = express();
  const app = await NestFactory.create(AppModule);
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));
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

    server.get('/api.json', (req, res) => {
      res.send(document);
    });
  }

  await app.listen(5000);
}
bootstrap();
