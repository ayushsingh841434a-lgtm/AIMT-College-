"use client";

import { useCallback, useEffect, useState } from "react";
import { Users, Briefcase, ShieldCheck, GraduationCap, Activity, Database } from "lucide-react";
import StatCard from "@/components/StatCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/Badge";
import { timeAgo, formatDateTime } from "@/lib/utils";

type UserListResponse = {
  data: { id: string }[];
  total: number;
};

type AuditRow = {
  id: string;
  action: string;
  actor: { name: string; email: string } | null;
  targetType: string | null;
  targetId: string | null;
  createdAt: string;
};

type AuditListResponse = {
  data: AuditRow[];
};

type LoadState = "loading" | "ready" | "error";

export default function AdminDashboardPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [counts, setCounts] = useState({ total: 0, management: 0, admin: 0, student: 0 });
  const [activity, setActivity] = useState<AuditRow[]>([]);
  const [dbConnected, setDbConnected] = useState(false);

  const load = useCallback(async () => {
    setState("loading");
    try {
      const [allRes, mgmtRes, adminRes, studentRes, auditRes] = await Promise.all([
        fetch("/api/users?page=1"),
        fetch("/api/users?role=MANAGEMENT&page=1"),
        fetch("/api/users?role=ADMIN&page=1"),
        fetch("/api/users?role=STUDENT&page=1"),
        fetch("/api/audit-logs?page=1"),
      ]);
      if (!allRes.ok || !mgmtRes.ok || !adminRes.ok || !studentRes.ok || !auditRes.ok) {
        throw new Error("One or more requests failed.");
      }
      const [all, mgmt, admin, student, audit] = (await Promise.all([
        allRes.json(),
        mgmtRes.json(),
        adminRes.json(),
        studentRes.json(),
        auditRes.json(),
      ])) as [UserListResponse, UserListResponse, UserListResponse, UserListResponse, AuditListResponse];

      setCounts({
        total: all.total ?? 0,
        management: mgmt.total ?? 0,
        admin: admin.total ?? 0,
        student: student.total ?? 0,
      });
      setActivity((audit.data ?? []).slice(0, 8));
      setDbConnected(true);
      setState("ready");
    } catch {
      setDbConnected(false);
      setState("error");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (state === "loading") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Loading system overview..." />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="font-semibold text-navy">Could not load the dashboard.</p>
        <p className="mt-1 text-sm text-slate-500">
          The server or database may be unavailable. Please try again.
        </p>
        <button
          onClick={load}
          className="mt-4 rounded-xl bg-royal px-4 py-2 text-sm font-semibold text-white hover:bg-navy"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">System Overview</h1>
        <p className="mt-1 text-sm text-slate-500">
          Live snapshot of accounts, roles and recent administrative activity.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={counts.total} icon={Users} tone="royal" sub="All registered accounts" />
        <StatCard label="Management Accounts" value={counts.management} icon={Briefcase} tone="royal" sub="Staff and office roles" />
        <StatCard label="Administrators" value={counts.admin} icon={ShieldCheck} tone="royal" sub="Full system access" />
        <StatCard label="Students" value={counts.student} icon={GraduationCap} tone="royal" sub="Enrolled student accounts" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-royal" />
            <h2 className="text-lg font-semibold text-navy">Recent Activity</h2>
          </div>
          {activity.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No recent activity"
              message="Administrative actions will appear here once they are logged."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {activity.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {row.actor?.name ?? "System"}
                      <span className="ml-2 font-mono text-xs text-royal">{row.action}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {row.actor?.email ?? "—"}
                      {row.targetType ? ` · ${row.targetType}${row.targetId ? ` (${row.targetId})` : ""}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400" title={formatDateTime(row.createdAt)}>
                    {timeAgo(row.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-royal" />
            <h2 className="text-lg font-semibold text-navy">System Status</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${dbConnected ? "bg-leaf" : "bg-college"}`} />
            <span className="text-sm font-medium text-slate-700">
              Database: {dbConnected ? "Connected" : "Unavailable"}
            </span>
          </div>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Students</span>
              <Badge tone="info">{counts.student}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Management staff</span>
              <Badge tone="info">{counts.management}</Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Administrators</span>
              <Badge tone="info">{counts.admin}</Badge>
            </div>
            <div className="border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between text-sm font-semibold text-navy">
                <span>Roles in use</span>
                <span>{[counts.student > 0, counts.management > 0, counts.admin > 0].filter(Boolean).length} of 3</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
