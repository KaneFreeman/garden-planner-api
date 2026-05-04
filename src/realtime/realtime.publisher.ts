import { Injectable } from '@nestjs/common';
import { RealtimeSyncMessage } from './interfaces/realtime-sync-message.interface';
import { RealtimeGateway } from './realtime.gateway';

@Injectable()
export class RealtimePublisher {
  constructor(private readonly realtimeGateway: RealtimeGateway) {}

  publishUserSync<TData extends Record<string, unknown> = Record<string, unknown>>(
    userId: string,
    reason: string,
    data: TData
  ) {
    const message: RealtimeSyncMessage<TData> = {
      scope: 'user',
      reason,
      occurredAt: new Date().toISOString(),
      data
    };

    this.realtimeGateway.emitUserSync(userId, message);
  }

  publishGardenSync<TData extends Record<string, unknown> = Record<string, unknown>>(
    userId: string,
    gardenId: string,
    reason: string,
    data: TData
  ) {
    const message: RealtimeSyncMessage<TData> = {
      scope: 'garden',
      reason,
      occurredAt: new Date().toISOString(),
      data
    };

    this.realtimeGateway.emitGardenSync(userId, gardenId, message);
  }
}
