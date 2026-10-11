"use client";

import { useState } from "react";
import { Landmark } from "lucide-react";

type CampusImageProps = {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
  imgClassName?: string;
  overlay?: boolean;
  fallbackLabel?: string;
};

/**
 * Campus photo with a branded navy fallback. If the image file is missing
 * (campus photos are added under public/images/), a tasteful AIMT-branded
 * placeholder is shown instead of a broken image.
 */
export default function CampusImage({
  src,
  alt,
  caption,
  className = "",
  imgClassName = "",
  overlay = true,
  fallbackLabel,
}: CampusImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`relative flex min-h-48 flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-deep to-navy p-6 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        {/* subtle dot pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.35) 1px, transparent 1px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
          <Landmark className="h-8 w-8 text-gold" />
        </div>
        <p className="relative mt-4 font-serif text-xl font-bold tracking-wide text-white">
          AIMT
        </p>
        <p className="relative mt-1 max-w-xs text-sm text-slate-300">
          {fallbackLabel ?? caption ?? "Ambalika Institute of Management and Technology, Lucknow"}
        </p>
      </div>
    );
  }

  return (
    <figure className={`relative overflow-hidden rounded-2xl ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover ${imgClassName}`}
        onError={() => setFailed(true)}
      />
      {overlay && (
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
      )}
      {caption && (
        <figcaption className="absolute inset-x-0 bottom-0 p-4 text-sm font-medium text-white">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
