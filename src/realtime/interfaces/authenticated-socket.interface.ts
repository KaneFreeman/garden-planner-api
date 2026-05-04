import { Socket } from 'socket.io';
import { SessionDTO } from '../../auth/dto/session.dto';

export type RealtimeSession = Omit<SessionDTO, 'accessToken' | 'refreshToken'>;

export interface RealtimeSocketData {
  session?: RealtimeSession;
  selectedGardenId?: string;
}

export type AuthenticatedSocket = Socket & {
  data: RealtimeSocketData;
};
