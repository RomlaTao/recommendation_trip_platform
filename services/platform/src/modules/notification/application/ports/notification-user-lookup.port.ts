export interface NotificationUserLookupPort {
  findEmailByUserId(userId: string): Promise<string | null>;
}
