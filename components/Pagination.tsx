"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
};

/** Compact page list: first, last, and a window around the current page. */
function pageItems(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const window = new Set<number>([1, 2, totalPages - 1, totalPages, page - 1, page, page + 1]);
  const nums = [...window].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const items: (number | "…")[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i]! - nums[i - 1]! > 1) items.push("…");
    items.push(nums[i]!);
  }
  return items;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const btn =
    "inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm font-medium transition";

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className={cn(
          btn,
          "gap-1 pr-3 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40",
        )}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
        Prev
      </button>

      {pageItems(page, totalPages).map((item, i) =>
        item === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-sm text-slate-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? "page" : undefined}
            className={cn(
              btn,
              item === page
                ? "bg-navy text-white shadow"
                : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className={cn(
          btn,
          "gap-1 pl-3 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40",
        )}
        aria-label="Next page"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
