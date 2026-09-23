"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { ArrowUp, Check, LogOut, MessageCircle, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import type { ChatMessage, ConversationSummary } from "@/lib/chat-types";

type Props = { adminEmail: string };

export default function ChatInbox({ adminEmail }: Props) {
  const socketRef = useRef<Socket | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Connecting");
  const [typing, setTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const queryConversation = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("conversation") : null;

  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const socket = io({ autoConnect: true, reconnection: true, reconnectionAttempts: Infinity });
    socketRef.current = socket;
    socket.on("connect", () => {
      setStatus("Connected");
      socket.emit("admin:join", (result: { conversations: ConversationSummary[] }) => {
        setConversations(result.conversations || []);
        const target = queryConversation && result.conversations.some((item) => item.id === queryConversation) ? queryConversation : result.conversations[0]?.id;
        if (target) setSelectedId(target);
      });
    });
    socket.on("disconnect", () => setStatus("Offline"));
    socket.io.on("reconnect_attempt", () => setStatus("Reconnecting"));
    socket.on("inbox:update", (items: ConversationSummary[]) => setConversations(items));
    socket.on("chat:message", (message: ChatMessage) => {
      if (message.conversationId === selectedIdRef.current) setMessages((items) => items.some((item) => item.id === message.id) ? items : [...items, message]);
    });
    socket.on("chat:typing", (payload: { role: string; isTyping: boolean }) => { if (payload.role === "visitor") setTyping(payload.isTyping); });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [queryConversation]);

  useEffect(() => {
    if (!selectedId || !socketRef.current?.connected) return;
    socketRef.current.emit("admin:join-conversation", selectedId, (result: { messages?: ChatMessage[] }) => setMessages(result.messages || []));
  }, [selectedId, status]);

  useEffect(() => {
    if (!selectedId) return;
    const conversation = conversations.find((item) => item.id === selectedId);
    if (conversation) socketRef.current?.emit("chat:mark-read", selectedId);
  }, [selectedId, conversations]);

  useEffect(() => {
    async function enablePush() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;
      const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
      if (permission !== "granted") return;
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY });
      await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) });
    }
    void enablePush();
  }, []);

  const selected = conversations.find((item) => item.id === selectedId);
  const label = (conversation: ConversationSummary) => conversation.visitorName || `Visitor #${conversation.visitorId.slice(-4)}`;

  function send(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || !selectedId || !socketRef.current) return;
    socketRef.current.emit("chat:send-message", { conversationId: selectedId, content }, (result: { error?: string }) => { if (!result.error) setInput(""); });
  }

  function setConversationStatus(nextStatus: "open" | "closed") {
    if (selectedId) socketRef.current?.emit("admin:set-status", { conversationId: selectedId, status: nextStatus });
  }

  return <main className="admin-chat-shell">
    <header className="admin-chat-topbar"><div><p className="eyebrow">Private inbox</p><h1>Live conversations</h1></div><div className="admin-chat-topbar__actions"><span className={`connection-dot connection-dot--${status.toLowerCase()}`} />{status}<span>{adminEmail}</span><button title="Sign out" onClick={async () => { await fetch("/api/admin/logout", { method: "POST" }); router.push("/admin/login"); }}><LogOut size={16} /></button></div></header>
    <section className="admin-inbox">
      <aside className={`admin-inbox__list ${sidebarOpen ? "" : "admin-inbox__list--hidden"}`}><div className="admin-inbox__list-head"><strong>Conversations</strong><span>{conversations.length}</span></div>{conversations.map((conversation) => <button className={`admin-conversation ${conversation.id === selectedId ? "admin-conversation--selected" : ""}`} key={conversation.id} onClick={() => setSelectedId(conversation.id)}><div><strong>{label(conversation)}</strong><small>{new Date(conversation.lastMessageAt).toLocaleString()}</small></div><p>{conversation.lastMessage?.content || "No messages yet"}</p>{conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}</button>)}</aside>
      <article className="admin-inbox__conversation"><div className="admin-conversation-head"><button className="admin-icon-button" onClick={() => setSidebarOpen((value) => !value)} title="Toggle conversations">{sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}</button>{selected ? <><div><strong>{label(selected)}</strong><small>{selected.status === "open" ? "Open conversation" : "Closed conversation"}</small></div><button className="admin-status-button" onClick={() => setConversationStatus(selected.status === "open" ? "closed" : "open")}>{selected.status === "open" ? <><X size={15} /> Close</> : <><Check size={15} /> Reopen</>}</button></> : <div><strong>Select a conversation</strong><small>Messages will appear here.</small></div>}</div>{selected ? <><div className="admin-messages">{messages.map((message) => <div className={`adnan-chat__message adnan-chat__message--${message.senderRole === "admin" ? "user" : "assistant"}`} key={message.id}><p>{message.content}</p><small>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>)}{typing && <div className="adnan-chat__typing"><i /><i /><i /></div>}</div><form className="adnan-chat__form admin-message-form" onSubmit={send}><textarea value={input} onChange={(event) => { setInput(event.target.value); if (selectedId) socketRef.current?.emit("chat:typing", selectedId); }} onBlur={() => selectedId && socketRef.current?.emit("chat:stop-typing", selectedId)} placeholder="Write a reply..." rows={1} maxLength={2000} /><button type="submit" aria-label="Send"><ArrowUp size={17} /></button></form></> : <div className="admin-empty"><MessageCircle size={30} /><p>Your visitor conversations will appear here.</p></div>}</article>
    </section>
  </main>;
}
