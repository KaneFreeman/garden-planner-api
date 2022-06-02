import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PlantModule } from './plant/plant.module';
import { TaskModule } from './task/task.module';
import { ContainerModule } from './container/container.module';
import { PictureModule } from './picture/picture.module';
import { StaticModule } from './static/static.module';
import { PlantInstanceModule } from './plant-instance/plant-instance.module';
import { MigrationModule } from './migration/migration.module';

const env = process.env.NODE_ENV || 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [env === 'production' ? '.env.production' : '.env.development']
    }),
    MongooseModule.forRoot(process.env.MONGO_URL ?? 'mongodb://localhost:27017/garden-planner-development', {
      useNewUrlParser: true
    }),
    PlantModule,
    PlantInstanceModule,
    TaskModule,
    ContainerModule,
    PictureModule,
    StaticModule,
    MigrationModule
  ],
  controllers: [AppController],
  providers: [AppService]
})
export class AppModule {}
