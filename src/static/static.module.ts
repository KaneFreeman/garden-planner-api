import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { StaticService } from './static.service';
import { StaticController } from './static.controller';
import { AuthenticationMiddleware } from '../common/authentication.middleware';

@Module({
  providers: [StaticService],
  controllers: [StaticController]
})
export class StaticModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer.apply(AuthenticationMiddleware).forRoutes({ method: RequestMethod.GET, path: '/api/static/plantData' });
  }
}
