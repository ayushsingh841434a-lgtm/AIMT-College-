"use client";

import { CalendarDays, Play, CheckCircle2, User } from "lucide-react";
import Badge from "./Badge";
import { formatDate } from "@/lib/utils";

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

export type TaskCardTask = {
  id: string;
  title: string;
  description: string;
  // Plain string: API payloads arrive as JSON, not as Prisma enums.
  status: string;
  dueDate: Date | string | null;
  assigneeName?: string;
};

const STATUS_META: Record<string, { label: string; tone: "gold" | "blue" | "green" }> = {
  PENDING: { label: "Pending", tone: "gold" },
  IN_PROGRESS: { label: "In progress", tone: "blue" },
  COMPLETED: { label: "Completed", tone: "green" },
};

const UNKNOWN_STATUS = { label: "Unknown", tone: "gold" as const };

type TaskCardProps = {
  task: TaskCardTask;
  onStatusChange?: (id: string, status: string) => void;
};

export default function TaskCard({ task, onStatusChange }: TaskCardProps) {
  const meta = STATUS_META[task.status] ?? UNKNOWN_STATUS;
  const completed = task.status === "COMPLETED";

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={meta.tone}>{meta.label}</Badge>
        {task.dueDate && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <CalendarDays className="h-3.5 w-3.5" />
            Due {formatDate(task.dueDate)}
          </span>
        )}
        {task.assigneeName && (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-500">
            <User className="h-3.5 w-3.5" />
            {task.assigneeName}
          </span>
        )}
      </div>

      <h3 className="mt-3 text-base font-bold text-navy">{task.title}</h3>
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
        {task.description}
      </p>

      {onStatusChange && !completed && (
        <div className="mt-4 flex gap-2">
          {task.status === "PENDING" && (
            <button
              type="button"
              onClick={() => onStatusChange(task.id, "IN_PROGRESS")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-white transition hover:bg-brand-dark"
            >
              <Play className="h-4 w-4" />
              Start task
            </button>
          )}
          {task.status === "IN_PROGRESS" && (
            <button
              type="button"
              onClick={() => onStatusChange(task.id, "COMPLETED")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-leaf px-3 py-1.5 text-sm font-medium text-white transition hover:brightness-95"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mark complete
            </button>
          )}
        </div>
      )}
    </article>
  );
}
