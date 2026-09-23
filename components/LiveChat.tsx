"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ChevronDown, MessageCircle, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import type { ChatMessage } from "@/lib/chat-types";

const VISITOR_KEY = "adnan_visitor_id";

function getVisitorId() {
  const saved = window.localStorage.getItem(VISITOR_KEY) || document.cookie.match(/(?:^|; )adnan_visitor_id=([^;]+)/)?.[1];
  const id = saved || crypto.randomUUID();
  window.localStorage.setItem(VISITOR_KEY, id);
  document.cookie = `adnan_visitor_id=${id}; Max-Age=31536000; Path=/; SameSite=Lax`;
  return id;
}

export default function LiveChat() {
  const socketRef = useRef<Socket | null>(null);
  const [open, setOpen] = useState(false);
  const [visitorId] = useState<string | null>(() => typeof window === "undefined" ? null : getVisitorId());
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const [status, setStatus] = useState("Connecting");
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!visitorId) return;
    const socket = io({ auth: { visitorId }, reconnection: true, reconnectionAttempts: Infinity });
    socketRef.current = socket;
    socket.on("connect", () => { setStatus("Connected"); socket.emit("visitor:join", {}, (result: { conversation?: { id: string }; messages?: ChatMessage[] }) => { if (result.conversation) setConversationId(result.conversation.id); setMessages(result.messages || []); }); });
    socket.on("disconnect", () => setStatus("Offline"));
    socket.io.on("reconnect_attempt", () => setStatus("Reconnecting"));
    socket.on("chat:message", (message: ChatMessage) => { setMessages((items) => items.some((item) => item.id === message.id) ? items : [...items, message]); if (message.senderRole === "admin" && !open) setUnread((count) => count + 1); });
    socket.on("chat:typing", (payload: { role: string; isTyping: boolean }) => { if (payload.role === "admin") setTyping(payload.isTyping); });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [open, visitorId]);

  useEffect(() => { if (open && conversationId) socketRef.current?.emit("chat:mark-read", conversationId); }, [open, conversationId]);

  function send(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || !conversationId || !socketRef.current) return;
    socketRef.current.emit("chat:send-message", { conversationId, content, visitorName: name || undefined }, (result: { error?: string }) => { if (!result.error) setInput(""); });
  }

  return <>
    <AnimatePresence>{!open && <motion.button className="adnan-chat-launcher" type="button" onClick={() => { setOpen(true); setUnread(0); }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} aria-label="Chat with Adnan"><span className="adnan-chat-launcher__icon"><MessageCircle size={17} />{unread > 0 && <b className="adnan-chat-badge">{unread}</b>}</span><span><strong>Chat with Adnan</strong><small>Talk directly, whenever you need.</small></span></motion.button>}</AnimatePresence>
    <AnimatePresence>{open && <motion.aside className="adnan-chat" initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} aria-label="Live chat with Adnan"><header className="adnan-chat__header"><div className="adnan-chat__identity"><span className="adnan-chat__avatar"><MessageCircle size={18} /></span><span><strong>Adnan</strong><small><i /> {status}</small></span></div><button type="button" onClick={() => setOpen(false)} aria-label="Close chat"><X size={18} /></button></header><div className="adnan-chat__messages" aria-live="polite">{messages.length === 0 && <p className="adnan-chat__inquiry-note">Send a message and Adnan will reply personally.</p>}{messages.map((message) => <div className={`adnan-chat__message adnan-chat__message--${message.senderRole === "visitor" ? "user" : "assistant"}`} key={message.id}><p>{message.content}</p></div>)}{typing && <div className="adnan-chat__typing" aria-label="Adnan is typing"><i /><i /><i /></div>}</div>{!nameSaved && <div className="adnan-chat__name"><input value={name} onChange={(event) => setName(event.target.value.slice(0, 80))} placeholder="Your name (optional)" /><button type="button" onClick={() => setNameSaved(true)}>Save</button></div>}<form className="adnan-chat__form" onSubmit={send}><textarea value={input} onChange={(event) => { setInput(event.target.value); if (conversationId) socketRef.current?.emit("chat:typing", conversationId); }} onBlur={() => conversationId && socketRef.current?.emit("chat:stop-typing", conversationId)} placeholder="Write a message..." maxLength={2000} rows={1} aria-label="Your message" /><button type="submit" disabled={!input.trim() || !conversationId} aria-label="Send message"><ArrowUp size={17} /></button></form><div className="adnan-chat__footer"><ChevronDown size={13} /> Real conversation with Adnan</div></motion.aside>}</AnimatePresence>
  </>;
}
