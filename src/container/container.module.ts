import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationMiddleware } from '../common/authentication.middleware';
import { ContainerService } from './container.service';
import { ContainerController } from './container.controller';
import { ContainerSchema } from './schemas/container.schema';
import { TaskModule } from '../task/task.module';
import { PlantModule } from '../plant/plant.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Container', schema: ContainerSchema }]),
    TaskModule,
    PlantModule,
  ],
  providers: [ContainerService],
  controllers: [ContainerController],
})
export class ContainerModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer
      .apply(AuthenticationMiddleware)
      .forRoutes(
        { method: RequestMethod.GET, path: '/api/container' },
        { method: RequestMethod.GET, path: '/api/container/:containerId' },
        { method: RequestMethod.POST, path: '/api/container' },
        { method: RequestMethod.PUT, path: '/api/container' },
        { method: RequestMethod.DELETE, path: '/api/container' },
      );
  }
}
