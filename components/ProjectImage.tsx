"use client";

import Image from "next/image";
import { useState } from "react";

type ProjectImageProps = {
  src?: string;
  alt: string;
  className?: string;
  /**
   * "contain" letterboxes the image instead of cropping it — use it for logos
   * and wordmarks, which the default crop would slice into fragments.
   */
  fit?: "cover" | "contain";
  /** Defaults to a full-width slot; pass the real slot width where it differs. */
  sizes?: string;
  priority?: boolean;
};

export default function ProjectImage({
  src,
  alt,
  className,
  fit = "cover",
  sizes = "100vw",
  priority = false,
}: ProjectImageProps) {
  const [imageError, setImageError] = useState(false);
  const hasSource = Boolean(src) && !imageError;

  if (!hasSource) {
    return (
      <div
        className={`project-image project-image--placeholder ${className ?? ""}`.trim()}
        role="img"
        aria-label={alt}
      >
        <span>Screenshot pending</span>
      </div>
    );
  }

  return (
    <div className={`project-image project-image--${fit} ${className ?? ""}`.trim()}>
      <Image
        src={src as string}
        alt={alt}
        fill
        unoptimized
        sizes={sizes}
        priority={priority}
        onError={() => setImageError(true)}
      />
    </div>
  );
}
