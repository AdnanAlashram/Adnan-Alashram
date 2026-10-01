"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, ChevronDown, MessageCircle, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { browserLocalPersistence, setPersistence, signInAnonymously } from "firebase/auth";
import { onValue, ref, set } from "firebase/database";
import { firebaseAuth, firebaseDatabase } from "@/lib/firebase";
import { conversationPath, ensureConversation, messagesPath, sendMessage, type ChatMessage, type ConversationSummary } from "@/lib/firebase-chat";

const VISITOR_KEY = "adnan_visitor_id";

function rememberVisitorId(id: string) {
  window.localStorage.setItem(VISITOR_KEY, id);
  document.cookie = `adnan_visitor_id=${id}; Max-Age=31536000; Path=/; SameSite=Lax`;
}

function getVisitorId() {
  const saved = window.localStorage.getItem(VISITOR_KEY) || document.cookie.match(/(?:^|; )adnan_visitor_id=([^;]+)/)?.[1];
  const id = saved || crypto.randomUUID();
  rememberVisitorId(id);
  return id;
}

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  const [visitorId, setVisitorId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [nameSaved, setNameSaved] = useState(false);
  const [status, setStatus] = useState("Connecting");
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let active = true;
    async function connect() {
      try {
        await setPersistence(firebaseAuth, browserLocalPersistence);
        const user = firebaseAuth.currentUser || (await signInAnonymously(firebaseAuth)).user;
        if (!active) return;
        const localVisitorId = getVisitorId();
        setVisitorId(localVisitorId);
        const savedName = window.localStorage.getItem(`${VISITOR_KEY}_name`) || "";
        setName(savedName);
        const existing = await ensureConversation(localVisitorId, user.uid, savedName || undefined);
        if (active) { setConversation(existing); setStatus("Connected"); }
      } catch (error) {
        console.error("FIREBASE VISITOR CHAT ERROR", error);
        if (active) setStatus("Unavailable");
      }
    }
    void connect();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const conversationId = conversation?.id;
    if (!conversationId) return;
    const unsubscribeConversation = onValue(conversationPath(conversationId), (snapshot) => {
      const next = snapshot.val() as ConversationSummary | null;
      if (next) { setConversation(next); if (!open) setUnread(next.unreadForVisitor || 0); }
    });
    const unsubscribeMessages = onValue(messagesPath(conversationId), (snapshot) => {
      const value = snapshot.val() as Record<string, ChatMessage> | null;
      const nextMessages = value ? Object.values(value).sort((a, b) => a.createdAt - b.createdAt) : [];
      setMessages(nextMessages);
      if (open && visitorId) {
        void set(ref(firebaseDatabase, `conversations/${conversationId}/unreadForVisitor`), 0).catch(() => undefined);
        nextMessages.forEach((message) => {
          if (message.senderRole === "admin" && !message.readByVisitor) void set(ref(firebaseDatabase, `messages/${conversationId}/${message.id}/readByVisitor`), true);
        });
      }
    });
    const unsubscribeTyping = onValue(ref(firebaseDatabase, `typing/${conversationId}/admin`), (snapshot) => setTyping(snapshot.val() === true));
    return () => { unsubscribeConversation(); unsubscribeMessages(); unsubscribeTyping(); };
  }, [conversation?.id, open, visitorId]);

  async function saveName() {
    const cleanName = name.trim().slice(0, 80);
    setName(cleanName);
    window.localStorage.setItem(`${VISITOR_KEY}_name`, cleanName);
    if (conversation && visitorId && cleanName && firebaseAuth.currentUser) setConversation(await ensureConversation(conversation.visitorId, firebaseAuth.currentUser.uid, cleanName));
    setNameSaved(true);
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    if (!conversation || !input.trim()) return;
    try { await sendMessage(conversation, "visitor", input); setInput(""); }
    catch (error) { console.error("FIREBASE MESSAGE ERROR", error); }
  }

  function setTypingState(value: boolean) {
    if (!conversation) return;
    void set(ref(firebaseDatabase, `typing/${conversation.id}/visitor`), value);
  }

  return <>
    <AnimatePresence>{!open && <motion.button className="adnan-chat-launcher" type="button" onClick={() => { setOpen(true); setUnread(0); }} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} aria-label="Chat with Adnan"><span className="adnan-chat-launcher__icon"><MessageCircle size={17} />{unread > 0 && <b className="adnan-chat-badge">{unread}</b>}</span><span><strong>Chat with Adnan</strong><small>Talk directly, whenever you need.</small></span></motion.button>}</AnimatePresence>
    <AnimatePresence>{open && <motion.aside className="adnan-chat" initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }} aria-label="Live chat with Adnan"><header className="adnan-chat__header"><div className="adnan-chat__identity"><span className="adnan-chat__avatar"><MessageCircle size={18} /></span><span><strong>Adnan</strong><small><i /> {status}</small></span></div><button type="button" onClick={() => setOpen(false)} aria-label="Close chat"><X size={18} /></button></header><div className="adnan-chat__messages" aria-live="polite">{messages.length === 0 && <p className="adnan-chat__inquiry-note">Send a message and Adnan will reply personally.</p>}{messages.map((message) => <div className={`adnan-chat__message adnan-chat__message--${message.senderRole === "visitor" ? "user" : "assistant"}`} key={message.id}><p>{message.content}</p></div>)}{typing && <div className="adnan-chat__typing" aria-label="Adnan is typing"><i /><i /><i /></div>}</div>{!nameSaved && <div className="adnan-chat__name"><input value={name} onChange={(event) => setName(event.target.value.slice(0, 80))} placeholder="Your name (optional)" /><button type="button" onClick={() => void saveName()}>Save</button></div>}<form className="adnan-chat__form" onSubmit={send}><textarea value={input} onChange={(event) => { setInput(event.target.value); setTypingState(true); }} onBlur={() => setTypingState(false)} placeholder="Write a message..." maxLength={2000} rows={1} aria-label="Your message" /><button type="submit" disabled={!input.trim() || !conversation} aria-label="Send message"><ArrowUp size={17} /></button></form><div className="adnan-chat__footer"><ChevronDown size={13} /> Real conversation with Adnan</div></motion.aside>}</AnimatePresence>
  </>;
}
