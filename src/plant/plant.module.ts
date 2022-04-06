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
  exports: [PlantService],
})
export class PlantModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer
      .apply(AuthenticationMiddleware)
      .forRoutes(
        { method: RequestMethod.GET, path: '/api/plant' },
        { method: RequestMethod.GET, path: '/api/plant/:plantId' },
        { method: RequestMethod.POST, path: '/api/plant' },
        { method: RequestMethod.PUT, path: '/api/plant' },
        { method: RequestMethod.DELETE, path: '/api/plant' },
      );
  }
}
