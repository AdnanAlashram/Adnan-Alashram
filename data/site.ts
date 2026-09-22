import { projects } from "./projects";

export const siteConfig = {
  name: "Adnan Alashram",
  owner: "Adnan Alashram",
  role: "Software Engineer | Full-Stack Developer",
  title: "Adnan Alashram — Software Engineer",
  description:
    "Adnan Alashram is a software engineer building modern web and mobile applications, scalable systems, and polished user experiences.",
  phone: "+963959602775",
  whatsapp: "+963959602775",
  email: "adnanalashram632@gmail.com",
  location: "Damascus · Remote",
  canonicalUrl: "https://example.com",
};

export const socialLinks: { label: string; href: string }[] = [];

export const services = [
  {
    id: "product-engineering",
    number: "01",
    title: "Product engineering",
    description:
      "I turn complex product ideas into clear, reliable web experiences with strong foundations and thoughtful interactions.",
    tags: ["React", "Next.js", "TypeScript"],
  },
  {
    id: "mobile-development",
    number: "02",
    title: "Web & mobile",
    description:
      "I build responsive web and cross-platform mobile applications that feel natural on every screen and stay maintainable as they grow.",
    tags: ["React Native", "Expo", "iOS / Android"],
  },
  {
    id: "systems",
    number: "03",
    title: "Systems & APIs",
    description:
      "I design the data flows, APIs, and real-time connections that make a product dependable behind the interface.",
    tags: ["Dashboards", "APIs", "Real-time"],
  },
  {
    id: "interface-craft",
    number: "04",
    title: "Interface craft",
    description:
      "I care about the details people feel: hierarchy, motion, feedback, accessibility, and the quiet confidence of a polished UI.",
    tags: ["Architecture", "Backend", "Integration"],
  },
];

export const technologies = [
  "React",
  "Next.js",
  "React Native",
  "Expo",
  "TypeScript",
  "Django",
  "REST APIs",
  "WebSockets",
  "PostgreSQL",
];

export const projectList = projects;
