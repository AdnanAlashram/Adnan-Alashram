import Reveal from "@/components/Reveal";

export default function About() {
  return (
    <section id="about" className="section section--about">
      <div className="shell about-grid">
        <Reveal>
          <div className="about-intro">
            <p className="eyebrow">About me / 02</p>
            <h2>I like the space between a sharp idea and a working product.</h2>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="about-copy">
            <p>
              I&apos;m Adnan, a software engineer who enjoys moving between product thinking and
              implementation. I work across frontend, backend, and mobile to make complex ideas feel
              simple, useful, and distinctly human.
            </p>
            <p>
              My approach is practical and detail-oriented: understand the people using a product,
              choose technology that earns its place, and build an experience that holds up beyond the
              first release. I&apos;m especially interested in real-time systems, maps, and products that
              connect people to essential services.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
