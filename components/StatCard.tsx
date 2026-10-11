import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardTone = "blue" | "green" | "red" | "purple" | "gold" | "royal";

const TONE_CLASSES: Record<StatCardTone, string> = {
  blue: "bg-blue-100 text-blue-700",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-700",
  purple: "bg-violet-100 text-violet-700",
  gold: "bg-amber-100 text-amber-700",
  royal: "bg-violet-100 text-royal",
};

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: StatCardTone;
  sub?: string;
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  tone = "blue",
  sub,
}: StatCardProps) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-navy">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            TONE_CLASSES[tone],
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
