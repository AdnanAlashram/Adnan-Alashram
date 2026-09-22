import { technologies } from "@/data/site";
import Reveal from "@/components/Reveal";

export default function TechStack() {
  return (
    <section className="section section--tech">
      <div className="shell tech-layout">
        <Reveal className="tech-layout__heading">
          <p className="eyebrow">Tools I use / 05</p>
          <h2>A stack chosen for clarity, speed, and room to grow.</h2>
        </Reveal>

        <div className="tech-grid" aria-label="Technology stack">
          {technologies.map((tech, index) => (
            <Reveal key={tech} delay={index * 0.04}>
              <div className="tech-item">{tech}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
