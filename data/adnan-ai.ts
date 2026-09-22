import { projects } from "@/data/projects";
import { siteConfig, socialLinks, technologies } from "@/data/site";

export const adnanKnowledge = {
  profile: {
    name: siteConfig.owner,
    title: siteConfig.title,
    role: siteConfig.role,
    introduction:
      "Adnan is a software engineer focused on building modern web and mobile applications, scalable systems, and polished user experiences.",
    interests: ["real-time systems", "maps", "product engineering", "interface craft"],
    location: siteConfig.location,
  },
  skills: {
    all: technologies,
    frontend: ["React", "Next.js", "TypeScript"],
    backend: ["Django", "REST APIs", "Django REST Framework", "WebSockets", "PostgreSQL"],
    mobile: ["React Native", "Expo", "Flutter"],
    tools: ["Google Maps", "GPS / geographic data"],
  },
  projects,
  experience: [],
  education: [],
  contact: {
    phone: siteConfig.phone,
    whatsapp: siteConfig.whatsapp,
    email: siteConfig.email,
    location: siteConfig.location,
    socialLinks,
    website: siteConfig.canonicalUrl,
  },
} as const;

export type AdnanKnowledge = typeof adnanKnowledge;
