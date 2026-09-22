import { NextResponse } from "next/server";
import { adnanKnowledge } from "@/data/adnan-ai";
import { answerLocally, isArabicMessage, localizedFallback } from "@/lib/adnan-ai";

const MAX_MESSAGE_LENGTH = 600;
const MAX_HISTORY = 8;
const GEMINI_TIMEOUT_MS = 8000;

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

const json = (body: { text: string; source: "local" | "gemini" | "fallback"; projectSlug?: string }) =>
  NextResponse.json(body, { status: 200 });

export async function POST(request: Request) {
  let fallbackMessage = "";
  try {
    const body = (await request.json()) as {
      message?: unknown;
      history?: unknown;
      currentProjectSlug?: unknown;
    };
    const message = typeof body.message === "string" ? body.message.trim() : "";
    fallbackMessage = message;

    if (!message) return json({ text: "Ask me something about Adnan's work.", source: "fallback" });
    if (message.length > MAX_MESSAGE_LENGTH) {
      return json({ text: isArabicMessage(message) ? "خلي سؤالك أقل من 600 حرف لو سمحت." : "Please keep your question under 600 characters.", source: "fallback" });
    }

    const currentProjectSlug =
      typeof body.currentProjectSlug === "string" ? body.currentProjectSlug : undefined;
    const rawHistory = Array.isArray(body.history) ? body.history : [];
    const previousAssistant = rawHistory
      .filter((item): item is HistoryMessage => Boolean(item) && typeof item === "object" && "role" in item && "content" in item && item.role === "assistant" && typeof item.content === "string")
      .at(-1)?.content;
    const localAnswer = answerLocally(message, currentProjectSlug, previousAssistant);
    if (localAnswer) {
      return json({ ...localAnswer, source: "local" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return json({ text: localizedFallback(message), source: "fallback" });

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (item): item is HistoryMessage =>
              Boolean(item) &&
              typeof item === "object" &&
              "role" in item &&
              "content" in item &&
              (item.role === "user" || item.role === "assistant") &&
              typeof item.content === "string",
          )
          .slice(-MAX_HISTORY)
          .map((item) => ({
            role: item.role === "assistant" ? "model" : "user",
            parts: [{ text: item.content.slice(0, MAX_MESSAGE_LENGTH) }],
          }))
      : [];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text: `You are Adnan AI, the professional portfolio assistant for Adnan Alashram. You are not Adnan himself. Have a natural conversation, not a FAQ flow. Use only verified facts in the portfolio and CV knowledge below; never invent projects, employers, clients, technologies, dates, achievements, education, experience, contact details, or availability. The current portfolio is the source of truth for current project details when it differs from older CV material. Understand English, Arabic, Syrian/Levantine Arabic, mixed Arabic and English, paraphrases, pronouns, omitted subjects, follow-ups, translation requests, and clarification requests. Reply naturally and concisely in the visitor's language. If they ask to translate or say they do not understand, use the previous relevant assistant message and explain or translate it. Small talk should receive a brief natural reply. If a project inquiry is underway, collect useful details conversationally and do not ask for information already provided. If information is unavailable, say so plainly. Portfolio and CV knowledge: ${JSON.stringify(adnanKnowledge)}`,
                },
              ],
            },
            contents: [...history, { role: "user", parts: [{ text: message }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 320 },
          }),
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) return json({ text: localizedFallback(message), source: "fallback" });

    const data = (await response.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!text) return json({ text: localizedFallback(message), source: "fallback" });

    return json({ text, source: "gemini" });
  } catch {
    return json({ text: localizedFallback(fallbackMessage), source: "fallback" });
  }
}
