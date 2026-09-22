import { projectList } from "@/data/site";
import ProjectCard from "@/components/ProjectCard";
import Reveal from "@/components/Reveal";

export default function Projects() {
  return (
    <section id="work" className="section section--projects">
      <Reveal className="shell">
        <div className="section-heading section-heading--split">
          <div>
            <p className="eyebrow">Selected work / 01</p>
            <h2>A few things I&apos;ve designed and built.</h2>
          </div>
          <p className="section-lead">
            Real project work across education, transportation, healthcare, and the systems behind them.
          </p>
        </div>
      </Reveal>

      <div className="projects-grid shell">
        {projectList.map((project, index) => (
          <ProjectCard key={project.slug} project={project} delay={index * 0.08} />
        ))}
      </div>
    </section>
  );
}
