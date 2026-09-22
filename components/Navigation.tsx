"use client";

import { ArrowUpRight, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { siteConfig } from "@/data/site";

const navItems = [
  { label: "Work", href: "#work" },
  { label: "Approach", href: "#process" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const MOBILE_BREAKPOINT = 980;

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close the menu on Escape, and when the viewport grows past the breakpoint
  // where the inline links come back.
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth > MOBILE_BREAKPOINT) setIsMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  return (
    <header className={`site-header ${isScrolled ? "site-header--compact" : ""}`}>
      <nav className="nav shell" aria-label="Main navigation">
        <a href="#top" className="brand" aria-label={`${siteConfig.name} - back to top`}>
          <span className="brand-mark">AA</span>
          <span className="brand-name">{siteConfig.name}</span>
        </a>

        <div className="nav-center">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </div>

    

        <button
          type="button"
          className="menu-button"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          aria-expanded={isMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsMenuOpen((value) => !value)}
        >
          {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {isMenuOpen && (
        <div className="mobile-menu" id="mobile-menu">
          <div className="shell">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)}>
                {item.label}
              </a>
            ))}
            <a
              href="#contact"
              className="button button--primary mobile-menu__cta"
              onClick={() => setIsMenuOpen(false)}
            >
              Get in touch
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
