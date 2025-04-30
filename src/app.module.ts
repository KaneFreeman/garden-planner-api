import { Logger, MiddlewareConsumer, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContainerModule } from './container/container.module';
import { GardenModule } from './garden/garden.module';
import { MailModule } from './mail/mail.module';
import { PictureModule } from './picture/picture.module';
import { PlantInstanceModule } from './plant-instance/plant-instance.module';
import { PlantModule } from './plant/plant.module';
import { StaticModule } from './static/static.module';
import { TaskModule } from './task/task.module';
import { UserModule } from './users/user.module';
import { DeviceIdMiddleware } from './middleware/device-id-middleware';

const env = process.env.NODE_ENV || 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [env === 'production' ? '.env.production' : '.env.development']
    }),
    MongooseModule.forRoot(process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017/', {
      retryAttempts: 0
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    UserModule,
    PlantModule,
    PlantInstanceModule,
    TaskModule,
    ContainerModule,
    PictureModule,
    StaticModule,
    MailModule,
    GardenModule
  ],
  controllers: [],
  providers: [AppService, Logger]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(DeviceIdMiddleware).forRoutes('*');
  }
}
