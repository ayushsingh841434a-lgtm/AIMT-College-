"use client";

import { useState } from "react";

type LogoProps = {
  size?: number;
  className?: string;
  showText?: boolean;
};

/**
 * AIMT college logo. Prefers the real logo file at
 * /images/aimt-logo.png and falls back to a branded navy monogram
 * (until the real logo file is added) so the header never shows a
 * broken image.
 */
export default function Logo({ size = 44, className = "", showText = false }: LogoProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {failed ? (
        <div
          className="flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-navy-deep shadow-md ring-1 ring-white/15"
          style={{ width: size, height: size }}
          aria-label="AIMT logo"
          role="img"
        >
          <span
            className="font-serif font-bold text-white"
            style={{ fontSize: size * 0.3, letterSpacing: "0.06em" }}
          >
            AIMT
          </span>
        </div>
      ) : (
        <img
          src="/images/aimt-logo.png"
          alt="AIMT — Ambalika Institute of Management and Technology logo"
          width={size}
          height={size}
          style={{ width: size, height: size }}
          className="shrink-0 object-contain"
          onError={() => setFailed(true)}
        />
      )}
      {showText && (
        <div className="leading-tight">
          <p className="text-sm font-bold text-white sm:text-base">
            Ambalika Institute of Management and Technology
          </p>
          <p className="text-[11px] font-medium tracking-wide text-slate-300 sm:text-xs">
            Lucknow, Uttar Pradesh
          </p>
        </div>
      )}
    </div>
  );
}
