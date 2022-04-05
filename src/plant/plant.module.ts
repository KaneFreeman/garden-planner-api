import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthenticationMiddleware } from '../common/authentication.middleware';
import { PlantService } from './plant.service';
import { PlantController } from './plant.controller';
import { PlantSchema } from './schemas/plant.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Plant', schema: PlantSchema }]),
  ],
  providers: [PlantService],
  controllers: [PlantController],
})
export class PlantModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer
      .apply(AuthenticationMiddleware)
      .forRoutes(
        { method: RequestMethod.GET, path: '/plant' },
        { method: RequestMethod.GET, path: '/plant/:plantId' },
        { method: RequestMethod.POST, path: '/plant' },
        { method: RequestMethod.PUT, path: '/plant' },
        { method: RequestMethod.DELETE, path: '/plant' },
      );
  }
}
