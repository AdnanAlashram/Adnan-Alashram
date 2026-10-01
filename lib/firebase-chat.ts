import { onValue, push, ref, set, update } from "firebase/database";
import type { DataSnapshot, Unsubscribe } from "firebase/database";
import { firebaseDatabase } from "@/lib/firebase";

export type SenderRole = "visitor" | "admin";
export type ConversationStatus = "open" | "closed";

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderRole: SenderRole;
  content: string;
  readByAdmin: boolean;
  readByVisitor: boolean;
  createdAt: number;
};

export type ConversationSummary = {
  id: string;
  visitorId: string;
  authUid: string;
  visitorName: string | null;
  status: ConversationStatus;
  lastMessageAt: number;
  createdAt: number;
  updatedAt: number;
  lastMessage: ChatMessage | null;
  unreadForAdmin: number;
  unreadForVisitor: number;
};

export const MAX_MESSAGE_LENGTH = 2000;

export function conversationPath(visitorId: string) {
  return ref(firebaseDatabase, `conversations/${visitorId}`);
}

export function messagesPath(conversationId: string) {
  return ref(firebaseDatabase, `messages/${conversationId}`);
}

export function subscribeToPath<T>(path: ReturnType<typeof ref>, callback: (value: T | null) => void): Unsubscribe {
  return onValue(path, (snapshot: DataSnapshot) => callback(snapshot.val() as T | null));
}

export async function ensureConversation(visitorId: string, authUid: string, visitorName?: string) {
  const conversationRef = conversationPath(visitorId);
  const now = Date.now();
  const existing = await new Promise<Record<string, unknown> | null>((resolve) => {
    const unsubscribe = onValue(conversationRef, (snapshot) => {
      unsubscribe();
      resolve(snapshot.val());
    }, { onlyOnce: true });
  });

  if (existing) {
    if (visitorName && existing.visitorName !== visitorName.slice(0, 80)) {
      await update(conversationRef, { visitorName: visitorName.slice(0, 80), updatedAt: now });
    }
    return existing as unknown as ConversationSummary;
  }

  const conversation: ConversationSummary = {
    id: visitorId,
    visitorId,
    authUid,
    visitorName: visitorName?.slice(0, 80) || null,
    status: "open",
    lastMessageAt: now,
    createdAt: now,
    updatedAt: now,
    lastMessage: null,
    unreadForAdmin: 0,
    unreadForVisitor: 0,
  };
  await set(conversationRef, conversation);
  await set(ref(firebaseDatabase, `visitors/${visitorId}`), { authUid, name: conversation.visitorName, createdAt: now, updatedAt: now });
  return conversation;
}

export async function sendMessage(conversation: ConversationSummary, senderRole: SenderRole, content: string) {
  const cleanContent = content.trim();
  if (!cleanContent || cleanContent.length > MAX_MESSAGE_LENGTH) throw new Error("Message must contain 1-2000 characters.");
  const messageRef = push(messagesPath(conversation.id));
  if (!messageRef.key) throw new Error("Unable to create message id.");
  const now = Date.now();
  const message: ChatMessage = {
    id: messageRef.key,
    conversationId: conversation.id,
    senderRole,
    content: cleanContent,
    createdAt: now,
    readByAdmin: senderRole === "admin",
    readByVisitor: senderRole === "visitor",
  };
  await set(messageRef, message);
  return message;
}
