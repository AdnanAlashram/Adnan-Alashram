"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Bot, ChevronDown, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { answerLocally, isArabicMessage, localizedFallback } from "@/lib/adnan-ai";
import {
  emptyProjectInquiry,
  buildWhatsAppMessage,
  inquiryFieldLabel,
  inquiryFields,
  inquirySummary,
  type InquiryField,
  type ProjectInquiry,
  validateProjectInquiry,
} from "@/lib/project-inquiry";

type Message = {
  id: number;
  role: "user" | "assistant";
  content: string;
  source?: "local" | "gemini" | "fallback";
};

type ApiResponse = {
  text?: string;
  source?: "local" | "gemini" | "fallback";
  projectSlug?: string;
};

type InquiryMode = "normal" | "collecting" | "review" | "sent";

const suggestions = [
  "Who is Adnan?",
  "What technologies does he use?",
  "Tell me about his projects.",
  "Tell me about PTP.",
  "What is Adnan's development approach?",
  "How can I contact Adnan?",
];

export default function AdnanChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const nextMessageId = useRef(2);
  const [currentProjectSlug, setCurrentProjectSlug] = useState<string>();
  const [inquiryMode, setInquiryMode] = useState<InquiryMode>("normal");
  const [inquiryArabic, setInquiryArabic] = useState(false);
  const [inquiry, setInquiry] = useState<ProjectInquiry>(emptyProjectInquiry);
  const [inquiryField, setInquiryField] = useState<InquiryField | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      role: "assistant",
      content: "Hi, I’m Adnan AI. Ask me about Adnan’s work, projects, or technical background.",
      source: "local",
    },
  ]);

  const appendAssistant = (content: string, source: Message["source"] = "local") => {
    setMessages((items) => [...items, { id: nextMessageId.current++, role: "assistant", content, source }]);
  };

  const startProjectInquiry = (arabic = false) => {
    setInquiry(emptyProjectInquiry);
    setInquiryArabic(arabic);
    setInquiryMode("collecting");
    setInquiryField("name");
    appendAssistant(
      arabic
        ? "ممتاز. رح ساعدك تجهّز طلب مشروع خطوة خطوة. أولًا، شو اسمك الكامل؟"
        : "Great. I’ll help you prepare a project request step by step. First, what’s your full name?",
    );
  };

  const questionForField = (field: InquiryField, arabic: boolean) =>
    arabic ? `شو ${inquiryFieldLabel(field, true)}؟` : `What is your ${inquiryFieldLabel(field, false)}?`;

  const isProjectStart = (message: string) =>
    /\b(start|request|build|begin).{0,20}\b(project|app|website)\b|\bproject inquiry\b|بدي.{0,20}(مشروع|تطبيق|موقع)|عندي فكرة.{0,20}مشروع|اتفق.{0,20}مشروع/i.test(message);

  const handleInquiryAnswer = (message: string) => {
    if (!inquiryField) return;
    const arabic = isArabicMessage(message);
    setInquiryArabic(arabic);
    const optional = ["originCity", "originCountry", "requirements", "desiredFeatures", "otherDetails"].includes(inquiryField);
    const skipped = /^(skip|none|no|n\/a|لا|ما في|مو مهم|غير مهم)$/i.test(message.trim());
    if (!message && !optional) {
      appendAssistant(arabic ? "هالمعلومة مطلوبة، خلينا نجرب مرة ثانية." : "That detail is required, so let’s try that one again.");
      return;
    }
    if (skipped && !optional) {
      appendAssistant(arabic ? "هالمعلومة مطلوبة، ما فينا نتخطاها." : "That detail is required, so we can’t skip it.");
      return;
    }
    const fieldErrors = validateProjectInquiry({ [inquiryField]: message });
    if (fieldErrors[inquiryField]) {
      appendAssistant(arabic ? `في مشكلة بهالمعلومة: ${fieldErrors[inquiryField]}` : fieldErrors[inquiryField] ?? "Please check that detail.");
      return;
    }

    const updated = { ...inquiry, [inquiryField]: skipped ? "" : message };
    setInquiry(updated);
    const index = inquiryFields.indexOf(inquiryField);
    const nextField = inquiryFields.slice(index + 1).find((field) => !updated[field] || optional);
    if (nextField) {
      setInquiryField(nextField);
      appendAssistant(questionForField(nextField, arabic));
      return;
    }
    setInquiryField(null);
    setInquiryMode("review");
    appendAssistant(arabic ? "ممتاز. راجع المعلومات التالية قبل الإرسال." : "Thanks. Please review the details below before sending.");
  };

  const sendInquiryViaWhatsApp = () => {
    const url = buildWhatsAppMessage(inquiry);
    window.open(url, "_blank", "noopener,noreferrer");
    setInquiryMode("sent");
    appendAssistant(
      inquiryArabic
        ? "تفاصيل مشروعك جاهزة على WhatsApp. اضغط Send داخل WhatsApp لإرسالها إلى عدنان."
        : "Your project details are ready in WhatsApp. Please press Send to send them to Adnan.",
    );
  };

  const sendMessage = async (value = input) => {
    const message = value.trim();
    if (!message || isLoading || message.length > 600) return;

    const userMessage: Message = { id: nextMessageId.current++, role: "user", content: message };
    setMessages((items) => [...items, userMessage]);
    setInput("");

    if (inquiryMode === "collecting") {
      handleInquiryAnswer(message);
      return;
    }
    if (inquiryMode === "review" || inquiryMode === "sent") return;
    if (isProjectStart(message)) {
      startProjectInquiry(isArabicMessage(message));
      return;
    }

    const localAnswer = answerLocally(message, currentProjectSlug);
    if (localAnswer) {
      setCurrentProjectSlug(localAnswer.projectSlug ?? currentProjectSlug);
      setMessages((items) => [
        ...items,
        { id: nextMessageId.current++, role: "assistant", content: localAnswer.text, source: "local" },
      ]);
      return;
    }

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setMessages((items) => [
        ...items,
        { id: nextMessageId.current++, role: "assistant", content: localizedFallback(message), source: "fallback" },
      ]);
      return;
    }

    setIsLoading(true);
    try {
      const history = [...messages, userMessage]
        .slice(-8)
        .map(({ role, content }) => ({ role, content }));
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, currentProjectSlug }),
      });
      const data = (await response.json()) as ApiResponse;
      setCurrentProjectSlug(data.projectSlug ?? currentProjectSlug);
      setMessages((items) => [
        ...items,
        {
          id: nextMessageId.current++,
          role: "assistant",
          content: data.text || localizedFallback(message),
          source: data.source ?? "fallback",
        },
      ]);
    } catch {
      setMessages((items) => [
        ...items,
        { id: nextMessageId.current++, role: "assistant", content: localizedFallback(message), source: "fallback" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            className="adnan-chat-launcher"
            type="button"
            onClick={() => setIsOpen(true)}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 18 }}
            aria-label="Chat with Adnan AI"
          >
            <span className="adnan-chat-launcher__icon"><Sparkles size={17} /></span>
            <span><strong>Chat with Adnan AI</strong><small>Ask about my work and skills</small></span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.aside
            className="adnan-chat"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            aria-label="Adnan AI chat"
          >
            <header className="adnan-chat__header">
              <div className="adnan-chat__identity">
                <span className="adnan-chat__avatar"><Bot size={18} /></span>
                <span><strong>Adnan AI</strong><small><i /> Portfolio assistant</small></span>
              </div>
              <button type="button" onClick={() => setIsOpen(false)} aria-label="Close Adnan AI"><X size={18} /></button>
            </header>

            <div className="adnan-chat__messages" aria-live="polite">
              {messages.map((message) => (
                <div className={`adnan-chat__message adnan-chat__message--${message.role}`} key={message.id}>
                  <p>{message.content}</p>
                  {message.role === "assistant" && message.source === "local" && <small>From Adnan&apos;s portfolio</small>}
                </div>
              ))}
              {isLoading && <div className="adnan-chat__typing" aria-label="Adnan AI is thinking"><i /><i /><i /></div>}
            </div>

            {inquiryMode === "normal" && (
              <button type="button" className="adnan-chat__project-cta" onClick={() => startProjectInquiry(false)} disabled={isLoading}>
                <Sparkles size={14} /> Start a Project
              </button>
            )}

            {inquiryMode === "collecting" && (
              <p className="adnan-chat__inquiry-note">Your information will only be used to review your project request and contact you about it.</p>
            )}

            {inquiryMode === "review" && (
              <div className="adnan-chat__review">
                <pre>{inquirySummary(inquiry, inquiryArabic)}</pre>
                <div className="adnan-chat__review-actions">
                  <button type="button" onClick={() => { setInquiryMode("collecting"); setInquiryField("name"); appendAssistant("Let’s update the details. What’s your full name?"); }}>Edit Information</button>
                  <button type="button" onClick={sendInquiryViaWhatsApp} disabled={isLoading}>Send via WhatsApp</button>
                </div>
                <small className="adnan-chat__inquiry-note">Your information will only be used to review your project request and contact you about it.</small>
              </div>
            )}

            {inquiryMode === "normal" && <div className="adnan-chat__suggestions">
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} disabled={isLoading}>{suggestion}</button>
              ))}
            </div>}

            {inquiryMode !== "review" && inquiryMode !== "sent" && (
              <form className="adnan-chat__form" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
                <input
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder={inquiryMode === "collecting" ? "Type your answer..." : "Ask about Adnan..."}
                  maxLength={600}
                  aria-label="Your message"
                />
                <button type="submit" disabled={!input.trim() || isLoading} aria-label="Send message"><ArrowUp size={17} /></button>
              </form>
            )}
            <div className="adnan-chat__footer"><ChevronDown size={13} /> Local answers first</div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
