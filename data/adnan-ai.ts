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
    professionalSummary:
      "Software Engineer with 3+ years of professional experience building scalable web applications, specializing in React.js and TypeScript, with experience in real-time platforms, admin dashboards, REST API integration, and multilingual products.",
  },
  skills: {
    all: technologies,
    frontend: ["React", "Next.js", "TypeScript"],
    backend: ["Django", "REST APIs", "Django REST Framework", "WebSockets", "PostgreSQL"],
    mobile: ["React Native", "Expo", "Flutter"],
    tools: ["Git", "Google Maps API", "Chart.js", "Agile development"],
  },
  projects,
  cvProjects: [
    { name: "Book Any Van", details: "A React and TypeScript dashboard for logistics, bookings, user interactions, tracking, and real-time chat via Socket.IO." },
    { name: "AI Ticketing System for Technical Support", details: "A React and TypeScript support system with role-based access, drag-and-drop ticket management, analytics charts, responsive UI, and reusable components." },
    { name: "XMidia", details: "A web app for scheduling, managing, and tracking posts on Meta platforms such as Facebook." },
    { name: "Miamed", details: "A dashboard for a medical system covering products, marketing tools, and delegate information." },
    { name: "DAL", details: "A platform for selling and renting real estate and cars, built with Laravel Blade." },
  ],
  experience: [
    { company: "Peak Link", role: "Front-End Developer", period: "Mar 2024 - Jan 2025", location: "Damascus", details: "Revived and completed stalled projects with Vue.js and React.js, and built a platform for managing social media pages." },
    { company: "Dr Code", role: "Front-End Developer", period: "Jun 2022 - Feb 2024", location: "Damascus", details: "Built corporate websites, admin control panels, multilingual products, and integrations with Laravel, Google Maps, Chart.js, and Calendar.js." },
    { company: "ICR Company", role: "Front-End Developer", period: "Jan 2022 - Mar 2022", location: "Damascus", details: "Built corporate websites with HTML, CSS, JavaScript, Bootstrap, and jQuery." },
  ],
  education: [{ degree: "Informatics Engineering", institution: "Syrian Private University", location: "Damascus", period: "Graduated Aug 2026" }],
  languages: { Arabic: "Native", English: "Intermediate" },
  developmentApproach:
    "Adnan works closely with back-end developers and UI/UX designers, values maintainable reusable components, and focuses on clear product experiences, real-time behavior, and multilingual access.",
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
