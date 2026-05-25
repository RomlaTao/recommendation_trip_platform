import { Injectable } from '@nestjs/common';
import type { Server } from 'socket.io';
import type { ChatServerRegistryPort } from '../../application/ports/chat-server-registry.port.js';

@Injectable()
export class ChatServerHolder implements ChatServerRegistryPort {
  private server?: Server;

  bindNamespaceServer(server: unknown): void {
    this.setServer(server as Server);
  }

  setServer(server: Server): void {
    this.server = server;
  }

  getServer(): Server {
    if (!this.server) {
      throw new Error('Chat Socket.IO server is not initialized');
    }
    return this.server;
  }

  hasServer(): boolean {
    return this.server !== undefined;
  }
}
