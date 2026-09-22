"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/data/site";

export default function Hero() {
  const prefersReducedMotion = useReducedMotion();

  // With reduced motion the elements render in their final state instead of
  // flying in — Framer drives inline styles, so CSS alone cannot stop it.
  const entrance = (from: Record<string, number>, duration: number, delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, ...from },
          animate: { opacity: 1, x: 0, y: 0, scale: 1 },
          transition: { duration, delay, ease: "easeOut" as const },
        };

  return (
    <section id="top" className="hero shell">
      <motion.div className="hero-copy" {...entrance({ y: 22 }, 0.7, 0)}>
        <p className="hero-kicker"><span /> Adnan Alashram / Software Engineer</p>
        <h1>
          I build digital
          <span>products that feel inevitable.</span>
        </h1>
        <p className="hero-text">
          I&apos;m {siteConfig.owner}, a software engineer focused on modern web and mobile
          applications, scalable systems, and interfaces people enjoy using.
        </p>
        <div className="hero-actions">
          <a href="#work" className="button button--primary">
            See my work
            <ArrowRight size={16} />
          </a>
          <a href="#contact" className="button button--secondary">Let&apos;s talk</a>
        </div>
      </motion.div>

      <div
        className="hero-visual"
        role="img"
        aria-label="An idea moving through architecture and product stages into a system in real-world use"
      >
        <div className="artifact-grid" />
        <div className="artifact-coordinate artifact-coordinate--top">SYSTEM MAP / 01</div>
        <div className="artifact-coordinate artifact-coordinate--bottom">BUILD STATUS / READY</div>
        <div className="artifact-route artifact-route--one" />
        <div className="artifact-route artifact-route--two" />
        <div className="artifact-route artifact-route--three" />

        <motion.div
          className="artifact-node artifact-node--idea"
          {...entrance({ scale: 0.7 }, 0.45, 0.25)}
        >
          <span className="artifact-node__signal" />
          <small>01 / INTENT</small>
          <strong>Clarity</strong>
        </motion.div>

        <motion.div className="artifact-system" {...entrance({ y: 18 }, 0.55, 0.55)}>
          <div className="artifact-system__header">
            <span>02 / ENGINEERING</span>
            <i>●</i>
          </div>
          <div className="artifact-system__body">
            <span className="system-pill system-pill--one">FLOW</span>
            <span className="system-pill system-pill--two">DATA</span>
            <span className="system-pill system-pill--three">UX</span>
            <span className="system-core" />
            <span className="system-connection system-connection--one" />
            <span className="system-connection system-connection--two" />
            <span className="system-connection system-connection--three" />
          </div>
        </motion.div>

        <motion.div className="artifact-product" {...entrance({ x: 24 }, 0.6, 0.9)}>
          <div className="artifact-product__bar">
            <span />
            <span />
            <span />
            <em>03 / EXPERIENCE</em>
          </div>
          <div className="artifact-product__content">
            <div className="product-sidebar">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="product-screen">
              <div className="product-screen__line" />
              <div className="product-screen__line product-screen__line--short" />
              <div className="product-screen__chart">
                <i />
                <i />
                <i />
                <i />
              </div>
              <div className="product-screen__footer">
                <span>Thoughtful detail</span>
                <b>Made to last</b>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div className="artifact-real" {...entrance({ y: 12 }, 0.5, 1.2)}>
          <span className="artifact-real__dot" />
          <span>
            <small>04 / DELIVERY</small>
            <strong>Ready to ship</strong>
          </span>
        </motion.div>
      </div>
    </section>
  );
}
