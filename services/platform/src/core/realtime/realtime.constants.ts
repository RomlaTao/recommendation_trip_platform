/** Per-user Socket.IO room for direct pushes (notifications, etc.). */
export const REALTIME_USER_ROOM_PREFIX = 'user:' as const;

export function userRoom(userId: string): string {
  return `${REALTIME_USER_ROOM_PREFIX}${userId}`;
}
