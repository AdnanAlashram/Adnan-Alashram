import { adnanKnowledge } from "@/data/adnan-ai";
import type { Project } from "@/data/projects";

export type ChatIntent =
  | "about"
  | "role"
  | "skills"
  | "frontend"
  | "backend"
  | "mobile"
  | "projects"
  | "project"
  | "education"
  | "experience"
  | "contact"
  | "hiring"
  | "github"
  | "linkedin"
  | "approach"
  | "unknown";

export type DetectedIntent = {
  intent: ChatIntent;
  confidence: number;
  project?: Project;
};

export type LocalAnswer = {
  text: string;
  intent: ChatIntent;
  confidence: number;
  projectSlug?: string;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function isArabicMessage(message: string) {
  return /[\u0600-\u06ff]/.test(message);
}

const intentTerms: Record<Exclude<ChatIntent, "project" | "unknown">, string[]> = {
  about: ["who", "about", "tell me about adnan", "introduce", "background", "person", "مين", "من هو", "خبرني عن", "عدنان"],
  role: ["role", "job", "profession", "what does adnan", "specialize", "speciality", "شو بيشتغل", "ماذا يعمل", "اختصاصه", "شو شغله"],
  skills: ["skills", "stack", "technologies", "technology", "code with", "tech stack", "tools", "تقنيات", "تكنولوجيات", "مهارات", "لغات برمجه", "فريموركات", "شو بيعرف"],
  frontend: ["frontend", "front end", "react", "next js", "nextjs", "typescript", "interface", "فرونت", "واجهة"],
  backend: ["backend", "back end", "django", "api", "apis", "database", "websocket", "server", "باك اند", "قواعد بيانات", "سيرفر"],
  mobile: ["mobile", "react native", "expo", "flutter", "ios", "android", "موبايل", "تطبيقات"],
  projects: ["projects", "work", "built", "created", "developed", "مشاريع", "مشاريعه", "اعمال", "شغله", "شغلو", "شوف شغله", "عملها"],
  education: ["education", "study", "university", "degree", "graduation", "تعليم", "درس", "دارس", "شهادته", "تخرج"],
  experience: ["experience", "employment", "employer", "company", "years", "خبرة", "خبرته", "وين اشتغل", "شركات"],
  contact: ["contact", "email", "reach", "get in touch", "تواصل", "ايميل", "إيميل", "احكي", "اوصلو", "اتواصل", "معو"],
  hiring: ["hire", "hiring", "work with", "opportunity", "وظف", "وظيفه", "فرصه شغل", "اشتغل مع", "متاح للعمل"],
  github: ["github", "source code", "repositories", "repo"],
  linkedin: ["linkedin", "professional profile"],
  approach: ["approach", "process", "mindset", "enjoy solving", "how does he work", "method", "نهجه", "طريقته", "كيف بيشتغل"],
};

const projectAliases: Record<string, string[]> = {
  ptp: ["ptp", "transportation", "bus", "public transport", "مشروع ptp", "باصات", "نقل"],
  sahtak: ["sahtak", "healthcare", "health", "doctor", "appointment", "صحتك", "اطباء", "مواعيد"],
  "syrian-scientific-school": ["syrian scientific school", "school", "student tracking", "attendance", "المدرسه السوريه العلميه", "طلاب", "حضور"],
};

function includesTerm(message: string, term: string) {
  if (term.includes(" ") || term.includes("/")) return message.includes(term);
  if (/[\u0600-\u06ff]/.test(term)) return message.includes(term);
  if (term.length <= 3) return new RegExp(`\\b${term}\\b`).test(message);
  return message.includes(term);
}

export function findProject(message: string, currentProjectSlug?: string) {
  const normalized = normalize(message);
  const explicit = adnanKnowledge.projects.find((project) => {
    const aliases = projectAliases[project.slug] ?? [project.name];
    return aliases.some((alias) => includesTerm(normalized, normalize(alias)));
  });
  if (explicit) return explicit;
  return adnanKnowledge.projects.find((project) => project.slug === currentProjectSlug);
}

export function detectIntent(message: string, currentProjectSlug?: string): DetectedIntent {
  const normalized = normalize(message);
  const project = findProject(message, currentProjectSlug);

  if (/\b(not|unknown|unavailable|outside|not listed)\b/.test(normalized)) {
    return { intent: "unknown", confidence: 0.1 };
  }

  if (project && /(technolog|technology|stack|code|used|feature|features|details|describe|what is|what are|تقني|تكنولوج|شو هو|خبرني|فكره|فكرة|مشكله|مشكلة|استخدم|فيه|فيها|المشروع)/.test(normalized)) {
    return { intent: "project", confidence: 0.96, project };
  }

  if (/\b(project|projects|project work|what has he built|which projects)\b|مشاريع|مشاريعه|الاعمال|شغله/.test(normalized)) {
    return { intent: "projects", confidence: 0.94, project };
  }

  const ranked = Object.entries(intentTerms)
    .map(([intent, terms]) => {
      const matches = terms.filter((term) => includesTerm(normalized, term));
      return { intent: intent as ChatIntent, score: matches.length / Math.max(terms.length * 0.18, 1) };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 0.42) {
    if (project) return { intent: "project", confidence: 0.72, project };
    return { intent: "unknown", confidence: 0.18 };
  }

  return { intent: best.intent, confidence: Math.min(0.95, 0.5 + best.score * 0.45), project };
}

const list = (items: readonly string[]) => items.join(", ");

function projectAnswer(project: Project, question: string, arabic: boolean) {
  const normalized = normalize(question);
  if (/technolog|stack|code|used|framework|تقني|تكنولوج|استخدم/.test(normalized)) {
    return arabic
      ? `مشروع ${project.name} بيستخدم: ${list(project.technologies)}.`
      : `${project.name} uses ${list(project.technologies)}.`;
  }
  if (/feature|include|can it|does it|ميزات|مزايا|بيشمل/.test(normalized) && project.features?.length) {
    return arabic
      ? `مشروع ${project.name} بيشمل: ${list(project.features)}.`
      : `${project.name} includes ${list(project.features)}.`;
  }
  if (/challenge|problem|مشكله|مشكلة|بيحل/.test(normalized) && project.challenge) {
    return arabic ? `المشكلة اللي بيعالجها ${project.name} هي: ${project.challenge}` : `The problem ${project.name} addresses is: ${project.challenge}`;
  }
  if (/solution|كيف اشتغل|كيف انحل|حل/.test(normalized) && project.solution) {
    return arabic ? `الحل في ${project.name} هو: ${project.solution}` : `The solution in ${project.name} is: ${project.solution}`;
  }
  const detail = project.overview ?? project.description;
  return arabic
    ? `${detail}${project.role ? ` وكان دور Adnan هو ${project.role}.` : ""}`
    : `${detail}${project.role ? ` Adnan's role was ${project.role}.` : ""}`;
}

export function generateLocalResponse(detected: DetectedIntent, question: string): LocalAnswer | null {
  const { intent, confidence, project } = detected;
  if (intent === "unknown" || confidence < 0.42) return null;

  const arabic = isArabicMessage(question);
  let text = "";
  switch (intent) {
    case "about":
      text = arabic
        ? `عدنان الأشرم هو ${adnanKnowledge.profile.role}. بيشتغل على بناء تطبيقات web وmobile حديثة، أنظمة قابلة للتوسع، وتجارب استخدام مصقولة.`
        : `${adnanKnowledge.profile.name} is a ${adnanKnowledge.profile.role}. ${adnanKnowledge.profile.introduction}`;
      break;
    case "role":
      text = arabic
        ? `عدنان ${adnanKnowledge.profile.role}. تركيزه بناء تطبيقات web وmobile حديثة، أنظمة قابلة للتوسع، وتجارب استخدام مرتبة.`
        : `Adnan is a ${adnanKnowledge.profile.role}. His focus is building modern web and mobile applications, scalable systems, and polished user experiences.`;
      break;
    case "skills":
      text = arabic
        ? `الـ tech stack تبع عدنان بيشمل ${list(adnanKnowledge.skills.all)}. وكمان بيهتم بالـ real-time systems والخرائط وتطوير interfaces مركّزة على المنتج.`
        : `Adnan's stack includes ${list(adnanKnowledge.skills.all)}. His work also includes real-time systems, maps, and product-focused interface development.`;
      break;
    case "frontend":
      text = arabic ? `بالـ frontend، عدنان بيستخدم ${list(adnanKnowledge.skills.frontend)}.` : `For frontend work, Adnan uses ${list(adnanKnowledge.skills.frontend)}.`;
      break;
    case "backend":
      text = arabic ? `بالـ backend والـ data، الـ portfolio بيذكر ${list(adnanKnowledge.skills.backend)}.` : `For backend and data work, the portfolio lists ${list(adnanKnowledge.skills.backend)}.`;
      break;
    case "mobile":
      text = arabic ? `بتطوير تطبيقات الموبايل، الـ portfolio بيذكر ${list(adnanKnowledge.skills.mobile)}.` : `For mobile development, the portfolio lists ${list(adnanKnowledge.skills.mobile)}.`;
      break;
    case "projects":
      text = arabic
        ? `مشاريع عدنان بتشمل ${adnanKnowledge.projects.map((item) => `${item.name} (${item.category})`).join("، ")}. فيك تسألني عن أي مشروع بالتفصيل.`
        : `Adnan's projects include ${adnanKnowledge.projects.map((item) => `${item.name} (${item.category})`).join(", ")}. Ask me about any one of them for more detail.`;
      break;
    case "project":
      if (!project) return null;
      text = projectAnswer(project, question, arabic);
      break;
    case "education":
      text = arabic ? "تفاصيل التعليم والدراسة غير موجودة بالـ portfolio حاليًا." : "Education details are not available in Adnan's portfolio yet.";
      break;
    case "experience":
      text = arabic ? "تفاصيل الخبرة الوظيفية وعدد سنوات الخبرة غير مذكورة بالـ portfolio حاليًا." : "Employment history and years of experience are not listed in Adnan's portfolio yet.";
      break;
    case "contact":
      text = arabic
        ? `فينيك تتواصل مع عدنان عبر الهاتف ${adnanKnowledge.contact.phone}، WhatsApp على https://wa.me/${adnanKnowledge.contact.whatsapp.replace(/\D/g, "")}، أو الإيميل ${adnanKnowledge.contact.email}.`
        : `You can contact Adnan by phone at ${adnanKnowledge.contact.phone}, WhatsApp at https://wa.me/${adnanKnowledge.contact.whatsapp.replace(/\D/g, "")}, or email at ${adnanKnowledge.contact.email}.`;
      break;
    case "hiring":
      text = arabic ? "الـ portfolio ما بيحدد حاليًا إذا عدنان متاح للتوظيف أو بيذكر طريقة مباشرة للتواصل معه." : "The portfolio does not currently specify Adnan's availability for hiring or provide a direct contact method.";
      break;
    case "github":
      text = arabic ? "رابط GitHub غير موجود بالـ portfolio حاليًا." : "A GitHub link is not listed in Adnan's portfolio yet.";
      break;
    case "linkedin":
      text = arabic ? "رابط LinkedIn غير موجود بالـ portfolio حاليًا." : "A LinkedIn link is not listed in Adnan's portfolio yet.";
      break;
    case "approach":
      text = arabic ? "نهج عدنان عملي ودقيق: يفهم الأشخاص اللي بيستخدموا المنتج، بيختار technology إلها قيمة، وبيبني تجربة بتضل قوية بعد أول release." : "Adnan's approach is practical and detail-oriented: understand the people using a product, choose technology that earns its place, and build an experience that holds up beyond the first release.";
      break;
  }

  return { text, intent, confidence, projectSlug: project?.slug };
}

export function answerLocally(question: string, currentProjectSlug?: string) {
  const detected = detectIntent(question, currentProjectSlug);
  return generateLocalResponse(detected, question);
}

export const localFallback =
  "I can answer questions about Adnan's projects, skills, experience, and background. Try asking me about his tech stack or a specific project.";

export const arabicFallback =
  "فيني جاوبك عن مشاريع عدنان، مهاراته، خبرته، وخلفيته. جرّب اسألني عن الـ tech stack تبعه أو عن مشروع معيّن.";

export function localizedFallback(message: string) {
  return isArabicMessage(message) ? arabicFallback : localFallback;
}
