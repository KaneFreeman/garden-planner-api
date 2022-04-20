import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PictureService } from './picture.service';
import { PictureController } from './picture.controller';
import { PictureSchema } from './schemas/picture.schema';
import { AuthenticationMiddleware } from '../common/authentication.middleware';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Picture', schema: PictureSchema }])],
  providers: [PictureService],
  controllers: [PictureController]
})
export class PictureModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer
      .apply(AuthenticationMiddleware)
      .forRoutes(
        { method: RequestMethod.GET, path: '/api/picture/:pictureId' },
        { method: RequestMethod.POST, path: '/api/picture' },
        { method: RequestMethod.DELETE, path: '/api/picture/:pictureId' }
      );
  }
}
