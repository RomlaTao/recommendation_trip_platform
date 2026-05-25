/** Outbound realtime transport (Socket.IO). Feature modules depend on this port only. */
export interface RealtimeEmitterPort {
  emitToUser(
    userId: string,
    event: string,
    payload: unknown,
  ): Promise<void>;

  emitToRoom(
    room: string,
    event: string,
    payload: unknown,
  ): Promise<void>;
}
