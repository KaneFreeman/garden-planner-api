import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import { auth } from 'express-oauth2-jwt-bearer';
import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { join } from 'path';
import * as winston from 'winston';
import { Console as ConsoleTransport, File as FileTransport } from 'winston/lib/winston/transports';
import { AppModule } from './app.module';

const env = process.env.NODE_ENV || 'production';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new ConsoleTransport({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('GardenPlannerAPI', {
              colors: true,
              prettyPrint: true
            })
          )
        }),
        new FileTransport({
          filename: join(
            __dirname,
            env === 'production' ? '../logs/garden-planner.log' : 'logs/garden-planner-dev.log'
          ),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('GardenPlannerAPI', {
              colors: true,
              prettyPrint: true
            })
          )
        })
      ]
    })
  });
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));
  app.enableCors();
  app.use(auth());

  if (env === 'development') {
    const options = new DocumentBuilder()
      .setTitle('Garden Planner')
      .setDescription('The Garden Planner API')
      .setVersion('1.0.0')
      .addServer('api')
      .build();
    const document = SwaggerModule.createDocument(app, options);
    SwaggerModule.setup('/swagger', app, document);
  }

  await app.listen(process.env.API_PORT ?? 5000);
}
bootstrap();
