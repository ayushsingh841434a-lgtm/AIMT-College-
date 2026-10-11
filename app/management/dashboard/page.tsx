"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell, ClipboardList, FolderOpen, LifeBuoy, Users } from "lucide-react";
import StatCard from "@/components/StatCard";
import CampusImage from "@/components/CampusImage";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/Badge";
import { ToastProvider, useToast } from "@/components/Toast";

type Notice = {
  id: string;
  title: string;
  audience: string;
  publishedAt: string;
  publisher: { name: string };
};

type Task = {
  id: string;
  title: string;
  status: string;
  dueDate: string | null;
  assignee: { name: string };
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ManagementDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    students: 0,
    notices: 0,
    tasks: 0,
    records: 0,
    openSupport: 0,
  });
  const [notices, setNotices] = useState<Notice[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, nRes, tRes, rRes, supRes] = await Promise.all([
        fetch("/api/students?pageSize=1", { credentials: "same-origin" }),
        fetch("/api/notices?pageSize=5", { credentials: "same-origin" }),
        fetch("/api/tasks?pageSize=5", { credentials: "same-origin" }),
        fetch("/api/records?pageSize=1", { credentials: "same-origin" }),
        fetch("/api/support-requests?status=OPEN&pageSize=1", { credentials: "same-origin" }),
      ]);
      if (!sRes.ok || !nRes.ok || !tRes.ok || !rRes.ok) {
        throw new Error("Could not load dashboard data.");
      }
      const [sBody, nBody, tBody, rBody] = await Promise.all([
        sRes.json(),
        nRes.json(),
        tRes.json(),
        rRes.json(),
      ]);
      const supBody = supRes.ok ? await supRes.json() : { total: 0 };
      setStats({
        students: sBody.total ?? 0,
        notices: nBody.total ?? 0,
        tasks: tBody.total ?? 0,
        records: rBody.total ?? 0,
        openSupport: supBody.total ?? 0,
      });
      setNotices(nBody.data ?? []);
      setTasks(tBody.data ?? []);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CampusImage
        src="/images/aimt-campus-main.jpg"
        alt="Aerial view of the AIMT Lucknow campus main building"
        className="h-44 sm:h-56"
        caption="Ambalika Institute of Management and Technology, Lucknow"
        fallbackLabel="Management Portal — Ambalika Institute of Management and Technology, Lucknow"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Students" value={stats.students} icon={Users} tone="blue" />
        <StatCard label="Published Notices" value={stats.notices} icon={Bell} tone="gold" />
        <StatCard label="Tasks Assigned" value={stats.tasks} icon={ClipboardList} tone="green" />
        <StatCard label="Student Records" value={stats.records} icon={FolderOpen} tone="red" />
      </div>

      {stats.openSupport > 0 && (
        <Link
          href="/management/tools"
          className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-amber-900 transition hover:bg-amber-100"
        >
          <LifeBuoy className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">
            {stats.openSupport} open support request{stats.openSupport === 1 ? "" : "s"} need
            attention.
          </p>
        </Link>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-navy">Latest Notices</h2>
            <Link href="/management/notices" className="text-sm font-medium text-brand hover:underline">
              Manage
            </Link>
          </div>
          {notices.length === 0 ? (
            <EmptyState title="No notices" message="No notices published yet." />
          ) : (
            <ul className="space-y-3">
              {notices.map((n) => (
                <li key={n.id} className="rounded-xl bg-mist px-4 py-3">
                  <p className="text-sm font-semibold text-navy">{n.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {n.publisher.name} · {formatDate(n.publishedAt)} ·{" "}
                    <Badge tone="blue">{n.audience}</Badge>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold text-navy">Recent Tasks</h2>
            <Link href="/management/tools" className="text-sm font-medium text-brand hover:underline">
              Manage
            </Link>
          </div>
          {tasks.length === 0 ? (
            <EmptyState title="No tasks" message="No tasks assigned yet." />
          ) : (
            <ul className="space-y-3">
              {tasks.map((t) => (
                <li key={t.id} className="rounded-xl bg-mist px-4 py-3">
                  <p className="text-sm font-semibold text-navy">{t.title}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t.assignee.name} · due {formatDate(t.dueDate)} ·{" "}
                    <Badge tone={t.status === "COMPLETED" ? "green" : t.status === "IN_PROGRESS" ? "blue" : "gold"}>
                      {t.status.replace("_", " ")}
                    </Badge>
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <ManagementDashboard />
    </ToastProvider>
  );
}
