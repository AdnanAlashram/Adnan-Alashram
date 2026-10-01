"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { getToken, onMessage } from "firebase/messaging";
import { onValue, ref, set } from "firebase/database";
import { ArrowUp, Check, LogOut, MessageCircle, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { firebaseAuth, firebaseDatabase, getFirebaseMessaging } from "@/lib/firebase";
import { messagesPath, sendMessage, type ChatMessage, type ConversationSummary } from "@/lib/firebase-chat";

type Props = { initialEmail?: string };

export default function ChatInbox({ initialEmail }: Props) {
  const router = useRouter();
  const selectedIdRef = useRef<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("Connecting");
  const [typing, setTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => onAuthStateChanged(firebaseAuth, (nextUser) => {
    if (!nextUser || nextUser.isAnonymous) { router.replace(`/admin/login${window.location.search}`); return; }
    void nextUser.getIdTokenResult().then((token) => {
      if (token.claims.admin !== true) { void signOut(firebaseAuth); router.replace(`/admin/login${window.location.search}`); return; }
      setUser(nextUser);
      setStatus("Connected");
    });
  }), [router]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onValue(ref(firebaseDatabase, "conversations"), (snapshot) => {
      const value = snapshot.val() as Record<string, ConversationSummary> | null;
      const items = value ? Object.values(value).sort((a, b) => b.lastMessageAt - a.lastMessageAt) : [];
      setConversations(items);
      const requested = new URLSearchParams(window.location.search).get("conversation");
      if (!selectedIdRef.current) setSelectedId(requested && items.some((item) => item.id === requested) ? requested : items[0]?.id || null);
    }, () => setStatus("Offline"));
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    if (!selectedId) return;
    const unsubscribeMessages = onValue(messagesPath(selectedId), (snapshot) => {
      const value = snapshot.val() as Record<string, ChatMessage> | null;
      setMessages(value ? Object.values(value).sort((a, b) => a.createdAt - b.createdAt) : []);
    });
    const unsubscribeTyping = onValue(ref(firebaseDatabase, `typing/${selectedId}/visitor`), (snapshot) => setTyping(snapshot.val() === true));
    void set(ref(firebaseDatabase, `conversations/${selectedId}/unreadForAdmin`), 0);
    return () => { unsubscribeMessages(); unsubscribeTyping(); };
  }, [selectedId]);

  useEffect(() => {
    if (!user) return;
    const adminUser = user;
    async function registerMessaging() {
      try {
        if (!("serviceWorker" in navigator) || !("Notification" in window) || !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) return;
        const permission = Notification.permission === "default" ? await Notification.requestPermission() : Notification.permission;
        if (permission !== "granted") return;
        const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        const messaging = await getFirebaseMessaging();
        if (!messaging) return;
        const token = await getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
        if (!token) return;
        const deviceId = window.localStorage.getItem("adnan_fcm_device_id") || crypto.randomUUID();
        window.localStorage.setItem("adnan_fcm_device_id", deviceId);
        await set(ref(firebaseDatabase, `adminDevices/${adminUser.uid}/${deviceId}`), { token, createdAt: Date.now(), updatedAt: Date.now(), userAgent: navigator.userAgent, platform: navigator.platform });
        onMessage(messaging, (payload) => {
          if (payload.data?.conversationId && Notification.permission === "granted") new Notification(payload.data.title || "New message", { body: payload.data.body, data: payload.data });
        });
      } catch (error) { console.error("FCM REGISTRATION ERROR", error); }
    }
    void registerMessaging();
  }, [user]);

  const selected = conversations.find((item) => item.id === selectedId) || null;
  const label = (conversation: ConversationSummary) => conversation.visitorName || `Visitor #${conversation.visitorId.slice(-4)}`;

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!selected || !input.trim()) return;
    try { await sendMessage(selected, "admin", input); setInput(""); }
    catch (error) { console.error("FIREBASE ADMIN MESSAGE ERROR", error); }
  }

  function setTypingState(value: boolean) {
    if (selectedId) void set(ref(firebaseDatabase, `typing/${selectedId}/admin`), value);
  }

  async function logout() { await signOut(firebaseAuth); router.replace("/admin/login"); }

  return <main className="admin-chat-shell"><header className="admin-chat-topbar"><div><p className="eyebrow">Private inbox</p><h1>Live conversations</h1></div><div className="admin-chat-topbar__actions"><span className="connection-dot" />{status}<span>{user?.email || initialEmail}</span><button title="Sign out" onClick={() => void logout()}><LogOut size={16} /></button></div></header><section className="admin-inbox"><aside className={`admin-inbox__list ${sidebarOpen ? "" : "admin-inbox__list--hidden"}`}><div className="admin-inbox__list-head"><strong>Conversations</strong><span>{conversations.length}</span></div>{conversations.map((conversation) => <button className={`admin-conversation ${conversation.id === selectedId ? "admin-conversation--selected" : ""}`} key={conversation.id} onClick={() => setSelectedId(conversation.id)}><div><strong>{label(conversation)}</strong><small>{new Date(conversation.lastMessageAt).toLocaleString()}</small></div><p>{conversation.lastMessage?.content || "No messages yet"}</p>{conversation.unreadForAdmin > 0 && <b>{conversation.unreadForAdmin}</b>}</button>)}</aside><article className="admin-inbox__conversation"><div className="admin-conversation-head"><button className="admin-icon-button" onClick={() => setSidebarOpen((value) => !value)} title="Toggle conversations">{sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}</button>{selected ? <><div><strong>{label(selected)}</strong><small>{selected.status === "open" ? "Open conversation" : "Closed conversation"}</small></div><button className="admin-status-button" onClick={() => void set(ref(firebaseDatabase, `conversations/${selected.id}/status`), selected.status === "open" ? "closed" : "open")}>{selected.status === "open" ? <><X size={15} /> Close</> : <><Check size={15} /> Reopen</>}</button></> : <div><strong>Select a conversation</strong><small>Messages will appear here.</small></div>}</div>{selected ? <><div className="admin-messages">{messages.map((message) => <div className={`adnan-chat__message adnan-chat__message--${message.senderRole === "admin" ? "user" : "assistant"}`} key={message.id}><p>{message.content}</p><small>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small></div>)}{typing && <div className="adnan-chat__typing"><i /><i /><i /></div>}</div><form className="adnan-chat__form admin-message-form" onSubmit={send}><textarea value={input} onChange={(event) => { setInput(event.target.value); setTypingState(true); }} onBlur={() => setTypingState(false)} placeholder="Write a reply..." rows={1} maxLength={2000} /><button type="submit" aria-label="Send"><ArrowUp size={17} /></button></form></> : <div className="admin-empty"><MessageCircle size={30} /><p>Your visitor conversations will appear here.</p></div>}</article></section></main>;
}
