"use client";

import type { ReactNode } from "react";

// Semantic aliases ("info", "success", "warning", "danger") map onto the
// same palette so callers can use either vocabulary.
type BadgeTone =
  | "blue"
  | "green"
  | "red"
  | "purple"
  | "gray"
  | "gold"
  | "info"
  | "success"
  | "warning"
  | "danger";

const TONE_CLASSES: Record<BadgeTone, string> = {
  blue: "bg-blue-100 text-blue-800 ring-blue-200",
  info: "bg-blue-100 text-blue-800 ring-blue-200",
  green: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  success: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  red: "bg-red-100 text-red-800 ring-red-200",
  danger: "bg-red-100 text-red-800 ring-red-200",
  purple: "bg-violet-100 text-violet-800 ring-violet-200",
  gray: "bg-slate-100 text-slate-700 ring-slate-200",
  gold: "bg-amber-100 text-amber-800 ring-amber-200",
  warning: "bg-amber-100 text-amber-800 ring-amber-200",
};

type BadgeProps = {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
};

export default function Badge({ children, tone = "gray", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
