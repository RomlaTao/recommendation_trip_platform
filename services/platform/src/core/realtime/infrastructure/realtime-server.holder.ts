import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';

@Injectable()
export class RealtimeServerHolder {
  private server?: Server;

  setServer(server: Server): void {
    this.server = server;
  }

  getServer(): Server {
    if (!this.server) {
      throw new Error('Socket.IO server is not initialized');
    }
    return this.server;
  }

  hasServer(): boolean {
    return this.server !== undefined;
  }
}
