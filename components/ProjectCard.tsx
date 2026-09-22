"use client";

import { ArrowUpRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import type { Project } from "@/data/projects";
import ProjectImage from "@/components/ProjectImage";

type ProjectCardProps = {
  project: Project;
  /** Stagger for the scroll-in reveal. */
  delay?: number;
};

export default function ProjectCard({ project, delay = 0 }: ProjectCardProps) {
  const prefersReducedMotion = useReducedMotion();

  // The card is a direct child of `.projects-grid`, so its layout modifier
  // controls the column span. Wrapping it in anything would break that.
  return (
    <motion.article
      className={`project-card project-card--${project.layout ?? "standard"}`}
      initial={prefersReducedMotion ? false : { opacity: 0, y: 28 }}
      whileInView={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={prefersReducedMotion ? undefined : { y: -6 }}
      transition={{ duration: 0.5, ease: "easeOut", delay }}
    >
      <Link
        href={`/projects/${project.slug}`}
        className="project-card__link"
        aria-label={`View the ${project.name} project`}
      >
        <div className="project-card__media">
          <ProjectImage
            src={project.coverImage}
            alt={`${project.name} preview`}
            fit={project.coverFit}
            sizes="(max-width: 640px) 100vw, (max-width: 980px) 50vw, 600px"
          />
        </div>

        <div className="project-card__content">
          <div className="project-card__meta">
            <span>{project.category}</span>
            <span>{project.year ?? "2026"}</span>
          </div>

          <div className="project-card__heading-row">
            <h3>{project.name}</h3>
            <span className="project-arrow" aria-hidden="true">
              <ArrowUpRight size={18} />
            </span>
          </div>

          <p>{project.description}</p>

          <div className="project-tags" aria-label={`${project.name} technologies`}>
            {project.technologies.map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </div>

          <span className="project-card__action" aria-hidden="true">
            View project <ArrowUpRight size={15} />
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
