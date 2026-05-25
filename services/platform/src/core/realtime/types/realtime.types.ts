import type { JwtRequestUser } from '../../../common/interfaces/jwt-payload.interface.js';
import type { Socket } from 'socket.io';

export type RealtimeSocketData = {
  user: JwtRequestUser;
};

export type AuthenticatedSocket = Socket & {
  data: RealtimeSocketData;
};
