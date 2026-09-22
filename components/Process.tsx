import Reveal from "@/components/Reveal";

const steps = [
  {
    id: "01",
    title: "Understand",
    text: "I get close to the problem, the people using it, and the constraints that matter.",
  },
  {
    id: "02",
    title: "Shape",
    text: "I turn requirements into a clear product flow with considered visual language and feedback.",
  },
  {
    id: "03",
    title: "Build",
    text: "I develop the interface and the system behind it with clean, resilient foundations.",
  },
  {
    id: "04",
    title: "Refine",
    text: "I test, polish, and keep improving the parts that make the experience feel effortless.",
  },
];

export default function Process() {
  return (
    <section id="process" className="section section--process">
      <div className="shell">
        <Reveal>
          <div className="section-heading section-heading--stacked">
            <p className="eyebrow">My approach / 04</p>
            <h2>Thoughtful work, from first question to final detail.</h2>
          </div>
        </Reveal>

        <div className="process-grid">
          {steps.map((step, index) => (
            <Reveal key={step.id} delay={index * 0.08}>
              <article className="process-card">
                <div className="process-card__index">{step.id}</div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
