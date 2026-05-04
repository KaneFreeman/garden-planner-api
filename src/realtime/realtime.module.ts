import { Logger, Module } from '@nestjs/common';
import { RealtimeAuthService } from './realtime-auth.service';
import { RealtimeGateway } from './realtime.gateway';
import { RealtimePublisher } from './realtime.publisher';

@Module({
  providers: [RealtimeAuthService, RealtimeGateway, RealtimePublisher, Logger],
  exports: [RealtimeGateway, RealtimePublisher]
})
export class RealtimeModule {}
