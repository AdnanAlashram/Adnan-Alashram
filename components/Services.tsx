import { services } from "@/data/site";
import Reveal from "@/components/Reveal";

export default function Services() {
  return (
    <section id="services" className="section section--dark">
      <div className="shell">
        <Reveal>
          <div className="section-heading section-heading--stacked">
            <p className="eyebrow eyebrow--light">What I bring / 03</p>
            <h2>One engineer, close to the whole product.</h2>
          </div>
        </Reveal>

        <div className="services-grid">
          {services.map((service, index) => (
            <Reveal key={service.id} delay={index * 0.08}>
              <article className="service-card">
                <div className="service-card__number">{service.number}</div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                {/* <div className="service-tags" aria-label={`${service.title} capabilities`}>
                  {service.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div> */}
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
