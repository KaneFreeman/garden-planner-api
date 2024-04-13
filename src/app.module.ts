import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { ContainerModule } from './container/container.module';
import { MailModule } from './mail/mail.module';
import { PictureModule } from './picture/picture.module';
import { PlantInstanceModule } from './plant-instance/plant-instance.module';
import { PlantModule } from './plant/plant.module';
import { StaticModule } from './static/static.module';
import { TaskModule } from './task/task.module';
import { UserModule } from './users/user.module';

const env = process.env.NODE_ENV || 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [env === 'production' ? '.env.production' : '.env.development']
    }),
    MongooseModule.forRoot(process.env.MONGO_URL ?? 'mongodb://127.0.0.1:27017/', {
      useNewUrlParser: true,
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
    MailModule
  ],
  controllers: [],
  providers: [Logger]
})
export class AppModule {}
