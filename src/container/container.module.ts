import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationMiddleware } from '../common/authentication.middleware';
import { ContainerService } from './container.service';
import { ContainerController } from './container.controller';
import { ContainerSchema } from './schemas/container.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Container', schema: ContainerSchema }]),
  ],
  providers: [ContainerService],
  controllers: [ContainerController],
})
export class ContainerModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer
      .apply(AuthenticationMiddleware)
      .forRoutes(
        { method: RequestMethod.GET, path: '/container' },
        { method: RequestMethod.GET, path: '/container/:containerId' },
        { method: RequestMethod.POST, path: '/container' },
        { method: RequestMethod.PUT, path: '/container' },
        { method: RequestMethod.DELETE, path: '/container' },
      );
  }
}
