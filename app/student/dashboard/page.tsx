"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Bell,
  ClipboardList,
  FolderOpen,
  LayoutDashboard,
  RefreshCw,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import NoticeCard, { type NoticeCardNotice } from "@/components/NoticeCard";
import TaskCard, { type TaskStatus } from "@/components/TaskCard";
import CampusImage from "@/components/CampusImage";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ToastProvider, useToast } from "@/components/Toast";
import { formatDate } from "@/lib/utils";

interface Me {
  id: string;
  name: string;
  email: string;
  role: string;
  studentId: string;
  status: string;
}

interface ApiNotice {
  id: string;
  title: string;
  body: string;
  audience: string;
  publishedAt: string;
  publisher?: { name: string };
  read: boolean;
}

interface ApiTask {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  creator?: { name: string };
}

interface ApiRecord {
  id: string;
  type: string;
  title: string;
  details: unknown;
  createdAt: string;
  author?: { name: string };
}

function toNoticeCard(n: ApiNotice): NoticeCardNotice {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    audience: n.audience as NoticeCardNotice["audience"],
    publishedAt: n.publishedAt,
    publisherName: n.publisher?.name,
    read: n.read,
  };
}

function toTaskCard(t: ApiTask) {
  return {
    id: t.id,
    title: t.title,
    description: t.description,
    status: t.status as TaskStatus,
    dueDate: t.dueDate,
    assigneeName: t.creator?.name,
  };
}

function DashboardContent() {
  const { toast } = useToast();
  const [me, setMe] = useState<Me | null>(null);
  const [notices, setNotices] = useState<ApiNotice[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [upcomingTasks, setUpcomingTasks] = useState<ApiTask[]>([]);
  const [recordsCount, setRecordsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, pendingRes, noticesRes, recordsRes, tasksRes] =
        await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/tasks?status=PENDING"),
          fetch("/api/notices"),
          fetch("/api/records"),
          fetch("/api/tasks"),
        ]);
      if (!meRes.ok || !pendingRes.ok || !noticesRes.ok || !recordsRes.ok || !tasksRes.ok) {
        throw new Error("Failed to load dashboard data");
      }
      const [meJson, pendingJson, noticesJson, recordsJson, tasksJson] =
        await Promise.all([
          meRes.json(),
          pendingRes.json(),
          noticesRes.json(),
          recordsRes.json(),
          tasksRes.json(),
        ]);
      setMe(meJson.user ?? null);
      const allTasks: ApiTask[] = tasksJson.data ?? [];
      setPendingCount((pendingJson.data ?? []).length);
      setUpcomingTasks(
        allTasks
          .filter((t) => t.status !== "COMPLETED")
          .sort(
            (a, b) =>
              new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
          )
          .slice(0, 5)
      );
      setNotices(noticesJson.data ?? []);
      setRecordsCount((recordsJson.data ?? []).length);
    } catch {
      setError(
        "We could not load your dashboard. Please check your connection and try again."
      );
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

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast("Task status updated", "success");
      load();
    } catch {
      toast("Could not update the task", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading your dashboard" />
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

  const unreadCount = notices.filter((n) => !n.read).length;
  const latestNotices = notices.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl shadow-sm">
        <CampusImage
          src="/images/aimt-campus-main.jpg"
          alt="AIMT campus"
          className="h-44 w-full"
          overlay
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-navy/85 via-navy/30 to-transparent p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-bold text-white sm:text-2xl">
              Welcome back, {me?.name ?? "Student"}
            </h1>
            {me?.studentId && (
              <Badge tone="gold">
                <span className="font-mono">{me.studentId}</span>
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-white/80">
            Ambalika Institute of Management and Technology, Lucknow
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending Tasks"
          value={pendingCount}
          icon={ClipboardList}
          tone="gold"
          sub="Awaiting your action"
        />
        <StatCard
          label="Unread Notices"
          value={unreadCount}
          icon={Bell}
          tone="blue"
          sub="Announcements to read"
        />
        <StatCard
          label="My Records"
          value={recordsCount}
          icon={FolderOpen}
          tone="green"
          sub="Academic & official records"
        />
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-navy">
              <Bell className="h-5 w-5 text-brand" /> Latest Notices
            </h2>
            <a
              href="/student/notices"
              className="text-sm font-semibold text-brand hover:text-brand-dark"
            >
              View all
            </a>
          </div>
          {latestNotices.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notices"
              message="There are no college notices for you right now."
            />
          ) : (
            <div className="space-y-4">
              {latestNotices.map((n) => (
                <NoticeCard
                  key={n.id}
                  notice={toNoticeCard(n)}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-navy">
              <LayoutDashboard className="h-5 w-5 text-brand" /> Upcoming Tasks
            </h2>
            <a
              href="/student/tasks"
              className="text-sm font-semibold text-brand hover:text-brand-dark"
            >
              View all
            </a>
          </div>
          {upcomingTasks.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="All caught up"
              message="You have no upcoming tasks. Well done."
            />
          ) : (
            <div className="space-y-4">
              {upcomingTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={toTaskCard(t)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Quick info strip */}
      <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <p className="text-sm text-slate-600">
          {me?.name && (
            <>
              Signed in as <span className="font-semibold text-navy">{me.name}</span>
              {me.studentId && (
                <>
                  {" "}· Student ID{" "}
                  <span className="font-mono font-semibold text-navy">{me.studentId}</span>
                </>
              )}
              .
            </>
          )}{" "}
          Today is {formatDate(new Date().toISOString())}.
        </p>
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  );
}
