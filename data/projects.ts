export type Project = {
  slug: string;
  title: string;
  name: string;
  category: string;
  year?: string;
  shortDescription: string;
  description: string;
  role?: string;
  subtitle?: string;
  platform?: string;
  technologies: string[];
  /** Image shown on the home page card. */
  coverImage: string;
  /**
   * How the cover should sit in the card frame. Use "contain" for logos and
   * wordmarks, which get destroyed by the default edge-to-edge crop.
   */
  coverFit?: "cover" | "contain";
  /**
  * Screenshots for the project page. The first is used as the full-bleed cover,
   * the rest fill the gallery. Both sections are skipped when this is empty.
   */
  images: { src: string; alt: string; caption?: string }[];
  overview?: string;
  challenge?: string;
  solution?: string;
  features?: string[];
  outcome?: string;
  ecosystem?: string[];
  engineering?: { label: string; value: string }[];
  layout?: "large" | "tall" | "wide" | "standard";
};

export const projects: Project[] = [
  {
    slug: "ptp",
    title: "PTP",
    name: "PTP",
    category: "Public Transportation Platform",
    year: "Graduation project",
    subtitle: "Smart Public Transportation Platform",
    platform: "Web and mobile ecosystem",
    shortDescription:
      "A full-stack public transportation platform for real-time bus tracking, route management, passenger trips and administrative operations.",
    description:
      "A public transportation platform connecting passengers, drivers and administrators through real-time bus tracking and service management.",
    role: "Full-stack product engineering",
    technologies: ["React", "React Native", "TypeScript", "Expo", "Django", "Django REST Framework", "Django Channels", "WebSockets", "PostgreSQL", "Google Maps", "GPS / geographic data"],
    coverImage: "/images/projects/ptp.png",
    images: [
      { src: "/images/projects/ptpapp.png", alt: "PTP passenger application showing live bus tracking on a map" },
      { src: "/images/projects/ptp-dashboard.png", alt: "PTP admin dashboard with fleet, route and driver status panels", caption: "Admin dashboard" },
    ],
    overview: "PTP is a multi-role transportation ecosystem that connects passengers, drivers, administrators and merchants through web and mobile applications.",
    challenge: "Public transportation operations span passenger trips, vehicle movement, routes, stops, subscriptions and administrative decisions. PTP brings these connected responsibilities into one product system.",
    solution: "The platform combines real-time vehicle location updates, route visualization, stop management, administrative workflows and a QR-based digital transportation card with zone and day/week/month subscription types.",
    features: ["Passenger application", "Driver application", "Admin dashboard", "Merchant functionality", "Real-time bus tracking", "Route and stop management", "Driver approval and assignment", "Transportation cards", "QR-based card handling", "Subscription management", "Zone-based subscriptions", "Complaints", "Trip management"],
    outcome: "A complete transportation ecosystem with distinct tools for the people and operations that keep the service moving.",
    ecosystem: ["Passenger App", "Driver App", "Merchant System", "Admin Dashboard", "Backend"],
    engineering: [
      { label: "Frontend", value: "React · React Native · TypeScript · Expo" },
      { label: "Backend", value: "Django · Django REST Framework" },
      { label: "Realtime", value: "Django Channels · WebSockets" },
      { label: "Data", value: "PostgreSQL · GPS / geographic data" },
      { label: "Mapping", value: "Google Maps" },
    ],
    layout: "tall",
  },
  {
    slug: "sahtak",
    title: "Sahtak",
    name: "Sahtak",
    category: "Healthcare Platform",
    year: "2026",
    shortDescription: "A healthcare platform connecting patients with doctors and simplifying the appointment booking experience.",
    description: "Sahtak is a modern healthcare platform designed to connect users with doctors through a streamlined digital experience. The platform allows users to discover doctors, explore relevant information, and book appointments, while providing doctors with tools to manage and filter their appointments and user-related information.",
    technologies: ["React", "TypeScript", "REST APIs"],
    coverImage: "/images/projects/sahtak-logo.svg",
    coverFit: "contain",
    images: [{ src: "/images/projects/sahtakapp.png", alt: "Sahtak healthcare platform landing experience" }],
    overview: "Sahtak bridges the gap between patients and doctors by bringing doctor discovery and appointment booking into one accessible digital platform. The experience is designed around making it easier for users to find the right doctor and manage appointments, while giving doctors practical tools to organize and filter their information.",
    challenge: "Finding the right doctor and arranging an appointment can involve unnecessary steps and fragmented communication. Sahtak was designed to bring these interactions into a clearer and more structured digital experience.",
    solution: "The platform provides users with a dedicated experience for discovering doctors and booking appointments, while doctors receive management capabilities that help them organize and filter relevant appointment and user information.",
    features: ["Doctor discovery", "Doctor information", "Appointment booking", "Doctor-side appointment management", "Filtering and organized information"],
    layout: "tall",
  },
  {
    slug: "syrian-scientific-school",
    title: "Syrian Scientific School",
    name: "Syrian Scientific School",
    category: "Education & Transportation System",
    year: "2025",
    shortDescription:
      "A school system for real-time student tracking, bus route planning, daily attendance management, and more.",
    description:
      "A web-based system developed for the 'Syrian Scientific School,' focusing on real-time student tracking, bus route mapping, and daily attendance management. The project integrates tracking and attendance-logging functions into an organized interface designed to meet the requirements of practical daily operations.",
    technologies: ["React", "TypeScript", "Google Maps" , "Laravel" , "Flutter"],
    coverImage: "/images/projects/syrian-scientific-school-logo.png",
    coverFit: "contain",
    // No screenshots available for this project yet — the project page renders
    // without the cover and gallery sections until some are added here.
    images: [],
    overview:
      "The system is designed to support school transportation operations and student management by providing real-time tracking, bus route information, and daily attendance workflows via a web-based interface and mobile applications.It comprises a web-based system alongside three applications tailored for teachers, students, and parents.",
    layout: "tall",
  },
];

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}
