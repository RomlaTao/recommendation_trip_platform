import { Injectable } from '@nestjs/common';
import { RealtimeEmitterPort } from '../ports/realtime-emitter.port.js';

@Injectable()
export class NoopRealtimeEmitter implements RealtimeEmitterPort {
  async emitToUser(): Promise<void> {}

  async emitToRoom(): Promise<void> {}
}
