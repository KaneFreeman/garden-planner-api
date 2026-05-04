import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { AuthenticatedSocket } from './interfaces/authenticated-socket.interface';
import { RealtimeSyncMessage } from './interfaces/realtime-sync-message.interface';
import { REALTIME_EVENTS, REALTIME_PATH, getGardenRoom, getUserRoom } from './realtime.constants';
import { RealtimeAuthService } from './realtime-auth.service';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true
  },
  path: REALTIME_PATH,
  transports: ['websocket']
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly logger: Logger,
    private readonly realtimeAuthService: RealtimeAuthService
  ) {}

  afterInit(server: Server) {
    server.use(async (socket, next) => {
      try {
        const authenticatedSocket = socket as AuthenticatedSocket;
        authenticatedSocket.data.session = await this.realtimeAuthService.authenticate(authenticatedSocket);
        next();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unauthorized';
        next(new Error(errorMessage));
      }
    });
  }

  async handleConnection(client: AuthenticatedSocket) {
    const session = client.data.session;
    if (!session) {
      client.disconnect(true);
      return;
    }

    await client.join(getUserRoom(session.userId));
    client.emit(REALTIME_EVENTS.connected, {
      connectedAt: new Date().toISOString(),
      userId: session.userId
    });
    this.logger.log(`Realtime client connected for user ${session.userId}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.data.session?.userId;
    if (userId) {
      this.logger.log(`Realtime client disconnected for user ${userId}`);
    }
  }

  @SubscribeMessage(REALTIME_EVENTS.gardenSubscribe)
  async handleGardenSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { gardenId?: string }
  ) {
    const userId = client.data.session?.userId;
    const nextGardenId = payload?.gardenId?.trim();
    if (!userId || !nextGardenId) {
      return { ok: false };
    }

    const previousGardenId = client.data.selectedGardenId;
    if (previousGardenId && previousGardenId !== nextGardenId) {
      await client.leave(getGardenRoom(userId, previousGardenId));
    }

    client.data.selectedGardenId = nextGardenId;
    await client.join(getGardenRoom(userId, nextGardenId));

    const response = {
      gardenId: nextGardenId,
      ok: true,
      subscribedAt: new Date().toISOString()
    };

    client.emit(REALTIME_EVENTS.gardenSubscribed, response);
    return response;
  }

  @SubscribeMessage(REALTIME_EVENTS.gardenUnsubscribe)
  async handleGardenUnsubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.data.session?.userId;
    const selectedGardenId = client.data.selectedGardenId;
    if (!userId || !selectedGardenId) {
      return { ok: false };
    }

    await client.leave(getGardenRoom(userId, selectedGardenId));
    client.data.selectedGardenId = undefined;

    return {
      gardenId: selectedGardenId,
      ok: true
    };
  }

  emitUserSync(userId: string, payload: RealtimeSyncMessage) {
    this.server.to(getUserRoom(userId)).emit(REALTIME_EVENTS.userSync, payload);
  }

  emitGardenSync(userId: string, gardenId: string, payload: RealtimeSyncMessage) {
    this.server.to(getGardenRoom(userId, gardenId)).emit(REALTIME_EVENTS.gardenSync, payload);
  }
}
