"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, RefreshCw } from "lucide-react";
import NoticeCard, { type NoticeCardNotice } from "@/components/NoticeCard";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ToastProvider, useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface ApiNotice {
  id: string;
  title: string;
  body: string;
  audience: string;
  publishedAt: string;
  publisher?: { name: string };
  read: boolean;
}

type Filter = "all" | "unread";

function NoticesContent() {
  const { toast } = useToast();
  const [notices, setNotices] = useState<ApiNotice[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notices");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setNotices(json.data ?? []);
    } catch {
      setError("We could not load the notices. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleMarkRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notices/${id}/read`, { method: "POST" });
      if (!res.ok) throw new Error();
      setNotices((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      toast("Notice marked as read", "success");
    } catch {
      toast("Could not mark the notice as read", "error");
    }
  };

  const unreadCount = notices.filter((n) => !n.read).length;
  const visible = filter === "unread" ? notices.filter((n) => !n.read) : notices;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading notices" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-navy">{error}</p>
        <button
          onClick={load}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">College Notices</h1>
          <p className="mt-1 text-sm text-slate-500">
            Official announcements from the college administration.
          </p>
        </div>
        <div className="flex gap-2">
          {(
            [
              { key: "all", label: `All (${notices.length})` },
              { key: "unread", label: `Unread (${unreadCount})` },
            ] as { key: Filter; label: string }[]
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                filter === f.key
                  ? "bg-navy text-white"
                  : "bg-white text-slate-600 shadow-sm hover:bg-mist"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <EmptyState
            icon={filter === "unread" ? BellOff : Bell}
            title={filter === "unread" ? "No unread notices" : "No notices"}
            message={
              filter === "unread"
                ? "You have read all the notices. Well done."
                : "There are no college notices for you right now."
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {visible.map((n) => (
            <NoticeCard
              key={n.id}
              notice={{
                id: n.id,
                title: n.title,
                body: n.body,
                audience: n.audience as NoticeCardNotice["audience"],
                publishedAt: n.publishedAt,
                publisherName: n.publisher?.name,
                read: n.read,
              }}
              onMarkRead={handleMarkRead}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentNoticesPage() {
  return (
    <ToastProvider>
      <NoticesContent />
    </ToastProvider>
  );
}
