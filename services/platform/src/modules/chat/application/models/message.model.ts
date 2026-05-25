export interface MessageModel {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}
