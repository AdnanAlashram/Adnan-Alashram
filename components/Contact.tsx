import { Mail, MessageCircle, Phone } from "lucide-react";
import Reveal from "@/components/Reveal";
import { siteConfig } from "@/data/site";

export default function Contact() {
  return (
    <section id="contact" className="section section--cta">
      <Reveal className="shell">
        <div className="cta-box">
          <p className="eyebrow eyebrow--dark">Contact / 06</p>
          <h2>Let&apos;s make something useful.</h2>
          <p>
            I&apos;m open to conversations with engineering teams, recruiters, and people working on
            thoughtful products. Tell me what you&apos;re building or what you&apos;re looking for.
          </p>
          <div className="contact-actions" aria-label="Contact Adnan">
            <a href={`tel:${siteConfig.phone}`} className="contact-action">
              <Phone size={17} />
              <span><small>Call</small><strong>+963 959 602 775</strong></span>
            </a>
            <a href={`https://wa.me/${siteConfig.whatsapp.replace(/\D/g, "")}`} className="contact-action" target="_blank" rel="noreferrer">
              <MessageCircle size={17} />
              <span><small>WhatsApp</small><strong>+963 959 602 775</strong></span>
            </a>
            <a href={`mailto:${siteConfig.email}`} className="contact-action">
              <Mail size={17} />
              <span><small>Email</small><strong>{siteConfig.email}</strong></span>
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
