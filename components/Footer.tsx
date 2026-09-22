import { siteConfig, socialLinks } from "@/data/site";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="shell footer-inner">
        <div className="footer-item footer-brand">
          <span className="brand-mark">AA</span>
          <span>{siteConfig.name}</span>
        </div>
        <p className="footer-note">Software Engineer</p>
        <div className="footer-links">
          {socialLinks.map((link) => <a key={link.label} href={link.href}>{link.label}</a>)}
        </div>
      </div>
    </footer>
  );
}
