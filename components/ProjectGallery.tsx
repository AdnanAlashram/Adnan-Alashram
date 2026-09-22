"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import ProjectImage from "@/components/ProjectImage";
import type { Project } from "@/data/projects";

type ProjectGalleryProps = {
  images: Project["images"];
  /** The first image is the largest tile — load it eagerly above the fold. */
  priority?: boolean;
};

export default function ProjectGallery({ images, priority = false }: ProjectGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const activeImage = activeIndex === null ? undefined : images[activeIndex];
  const isOpen = activeImage !== undefined;

  const open = useCallback((index: number) => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    setActiveIndex(index);
  }, []);

  const close = useCallback(() => setActiveIndex(null), []);

  const step = useCallback(
    (direction: 1 | -1) =>
      setActiveIndex((index) =>
        index === null ? 0 : (index + direction + images.length) % images.length,
      ),
    [images.length],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", handleKeyDown);

    // Stop the page behind the lightbox from scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      // Send focus back to the thumbnail that opened the viewer.
      lastFocusedRef.current?.focus();
    };
  }, [isOpen, close, step]);

  if (images.length === 0) return null;

  return (
    <>
      <div className="project-gallery">
        {images.map((image, index) => (
          <button
            type="button"
            className={`project-gallery__item ${index === 0 ? "project-gallery__item--featured" : ""}`}
            key={image.src}
            onClick={() => open(index)}
            aria-label={`Open ${image.alt} in the image viewer`}
          >
            <ProjectImage
              src={image.src}
              alt={image.alt}
              sizes={index === 0 ? "100vw" : "(max-width: 800px) 100vw, 50vw"}
              priority={priority && index === 0}
            />
            {image.caption && <span>{image.caption}</span>}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {activeImage && (
          <motion.div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeImage.alt} enlarged`}
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReducedMotion ? undefined : { opacity: 0 }}
            onClick={close}
          >
            <button
              type="button"
              ref={closeButtonRef}
              className="lightbox__close"
              onClick={close}
              aria-label="Close image viewer"
            >
              <X size={20} />
            </button>

            {images.length > 1 && (
              <button
                type="button"
                className="lightbox__previous"
                onClick={(event) => {
                  event.stopPropagation();
                  step(-1);
                }}
                aria-label="Previous image"
              >
                <ChevronLeft />
              </button>
            )}

            <motion.div
              className="lightbox__image"
              initial={prefersReducedMotion ? false : { scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={(event) => event.stopPropagation()}
            >
              <Image src={activeImage.src} alt={activeImage.alt} fill sizes="90vw" unoptimized />
            </motion.div>

            {images.length > 1 && (
              <button
                type="button"
                className="lightbox__next"
                onClick={(event) => {
                  event.stopPropagation();
                  step(1);
                }}
                aria-label="Next image"
              >
                <ChevronRight />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
