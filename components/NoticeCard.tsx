"use client";

import { Bell, CheckCheck } from "lucide-react";
import Badge from "./Badge";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type NoticeCardNotice = {
  id: string;
  title: string;
  body: string;
  // Plain string: API payloads arrive as JSON, not as Prisma enums.
  audience: string;
  publishedAt: Date | string;
  publisherName?: string;
  read?: boolean;
};

const AUDIENCE_TONE: Record<string, "blue" | "green" | "purple"> = {
  ALL: "blue",
  STUDENT: "green",
  MANAGEMENT: "purple",
};

const AUDIENCE_LABEL: Record<string, string> = {
  ALL: "Everyone",
  STUDENT: "Students",
  MANAGEMENT: "Management",
};

type NoticeCardProps = {
  notice: NoticeCardNotice;
  onMarkRead?: (id: string) => void;
};

export default function NoticeCard({ notice, onMarkRead }: NoticeCardProps) {
  const showMarkRead = onMarkRead && !notice.read;
  const audienceTone = AUDIENCE_TONE[notice.audience] ?? "blue";
  const audienceLabel = AUDIENCE_LABEL[notice.audience] ?? notice.audience;

  return (
    <article
      className={cn(
        "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100 transition",
        notice.read && "opacity-80",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={audienceTone}>{audienceLabel}</Badge>
        {!notice.read && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
            <Bell className="h-3.5 w-3.5" />
            New
          </span>
        )}
        <span className="ml-auto text-xs text-slate-400">
          {timeAgo(notice.publishedAt)}
        </span>
      </div>

      <h3 className="mt-3 text-base font-bold text-navy">{notice.title}</h3>
      {notice.publisherName && (
        <p className="mt-0.5 text-xs text-slate-400">
          Published by {notice.publisherName}
        </p>
      )}
      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
        {notice.body}
      </p>

      {showMarkRead && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => onMarkRead(notice.id)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-brand transition hover:bg-blue-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark as read
          </button>
        </div>
      )}
    </article>
  );
}
