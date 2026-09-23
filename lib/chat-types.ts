export type SenderRole = "visitor" | "admin";
export type ConversationStatus = "open" | "closed";

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderRole: SenderRole;
  content: string;
  readByAdmin: boolean;
  readByVisitor: boolean;
  createdAt: string;
};

export type ConversationSummary = {
  id: string;
  visitorId: string;
  visitorName: string | null;
  status: ConversationStatus;
  lastMessageAt: string;
  createdAt: string;
  unreadCount: number;
  lastMessage: ChatMessage | null;
};
