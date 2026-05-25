export const CONVERSATION_TYPES = {
  DIRECT: 'direct',
} as const;

export type ConversationType =
  (typeof CONVERSATION_TYPES)[keyof typeof CONVERSATION_TYPES];

export const CHAT_MESSAGE_NEW_EVENT = 'chat:message:new' as const;
export const CHAT_CONVERSATION_READ_EVENT = 'chat:conversation:read' as const;

export const CHAT_WS_EVENTS = {
  JOIN_CONVERSATION: 'conversation:join',
} as const;

export const CONVERSATION_ROOM_PREFIX = 'conversation:' as const;

export function conversationRoom(conversationId: string): string {
  return `${CONVERSATION_ROOM_PREFIX}${conversationId}`;
}

export function buildDirectConversationKey(
  userIdA: string,
  userIdB: string,
): string {
  return [userIdA, userIdB].sort().join(':');
}
