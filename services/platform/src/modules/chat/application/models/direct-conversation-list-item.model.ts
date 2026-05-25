export interface ChatParticipantModel {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface LastMessagePreviewModel {
  id: string;
  body: string;
  senderUserId: string;
  createdAt: Date;
}

export interface DirectConversationListItemModel {
  id: string;
  type: 'direct';
  otherParticipant: ChatParticipantModel;
  lastMessage: LastMessagePreviewModel | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DirectInboxRowModel {
  conversationId: string;
  type: 'direct';
  createdAt: Date;
  updatedAt: Date;
  otherUserId: string;
  lastMessage: LastMessagePreviewModel | null;
  unreadCount: number;
}
