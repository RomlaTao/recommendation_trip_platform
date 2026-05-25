import type {
  NotificationChannel,
  NotificationTemplate,
} from '../../notification.types.js';

export interface CreatePendingDeliveryInput {
  sourceEventId: string;
  channel: NotificationChannel;
  templateCode: NotificationTemplate;
  recipient: string;
  payload: unknown;
}

export interface NotificationDeliveryRecord {
  id: string;
  attempts: number;
}

export interface NotificationDeliveryRepositoryPort {
  existsBySourceEventId(sourceEventId: string): Promise<boolean>;
  createPending(
    input: CreatePendingDeliveryInput,
  ): Promise<NotificationDeliveryRecord>;
  findById(id: string): Promise<NotificationDeliveryRecord | null>;
  markSent(id: string, attempts: number): Promise<void>;
  markFailed(id: string, error: unknown): Promise<void>;
  markDeadLetter(id: string, error: unknown): Promise<void>;
}
