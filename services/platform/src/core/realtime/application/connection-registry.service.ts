import { Injectable } from '@nestjs/common';

/**
 * Tracks active socket ids per user (debug/metrics). Delivery uses Socket.IO rooms.
 */
@Injectable()
export class ConnectionRegistryService {
  private readonly userToSockets = new Map<string, Set<string>>();
  private readonly socketToUser = new Map<string, string>();

  register(userId: string, socketId: string): void {
    this.socketToUser.set(socketId, userId);
    let set = this.userToSockets.get(userId);
    if (!set) {
      set = new Set();
      this.userToSockets.set(userId, set);
    }
    set.add(socketId);
  }

  unregister(socketId: string): void {
    const userId = this.socketToUser.get(socketId);
    if (!userId) {
      return;
    }
    this.socketToUser.delete(socketId);
    const set = this.userToSockets.get(userId);
    if (!set) {
      return;
    }
    set.delete(socketId);
    if (set.size === 0) {
      this.userToSockets.delete(userId);
    }
  }

  isUserOnline(userId: string): boolean {
    const set = this.userToSockets.get(userId);
    return set !== undefined && set.size > 0;
  }
}
