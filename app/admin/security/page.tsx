"use client";

import { useCallback, useEffect, useState } from "react";
import { MonitorSmartphone, LogIn, KeyRound, Eye, EyeOff } from "lucide-react";
import DataTable from "@/components/DataTable";
import FormField from "@/components/FormField";
import Badge from "@/components/Badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { ToastProvider, useToast } from "@/components/Toast";
import { formatDateTime, timeAgo } from "@/lib/utils";

type SessionRow = {
  id: string;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
  current: boolean;
};

type LoginEvent = {
  id: string;
  action: string;
  actor: { name: string; email: string } | null;
  ipAddress: string | null;
  details: unknown;
  createdAt: string;
};

function describeDevice(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent.toLowerCase();
  let os = "Unknown OS";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os")) os = "macOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("linux")) os = "Linux";
  let browser = "Unknown browser";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari")) browser = "Safari";
  return `${browser} on ${os}`;
}

function SecurityInner() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [logins, setLogins] = useState<LoginEvent[]>([]);
  const [loginsLoading, setLoginsLoading] = useState(true);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changing, setChanging] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const res = await fetch("/api/sessions");
      if (!res.ok) throw new Error("Failed to load sessions.");
      const body = await res.json();
      setSessions(body.data ?? []);
    } catch (e) {
      setSessionsError(e instanceof Error ? e.message : "Failed to load sessions.");
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const loadLogins = useCallback(async () => {
    setLoginsLoading(true);
    try {
      const res = await fetch("/api/audit-logs?action=auth.login&page=1");
      if (!res.ok) throw new Error("Failed to load login events.");
      const body = await res.json();
      setLogins((body.data ?? []).slice(0, 10));
    } catch {
      setLogins([]);
    } finally {
      setLoginsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadLogins();
  }, [loadSessions, loadLogins]);

  async function revokeSession(id: string) {
    if (!window.confirm("Revoke this session? The device will be signed out immediately.")) return;
    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.reason || err.message || "Failed to revoke session.");
      }
      toast("Session revoked.", "success");
      loadSessions();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to revoke session.", "error");
    }
  }

  async function changePassword() {
    setPwError(null);
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setChanging(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.reason || err.message || "Password change failed.");
      }
      toast("Password changed successfully.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Password change failed.";
      setPwError(msg);
      toast(msg, "error");
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Account Security</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your active sessions, change your password and review recent sign-ins.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 px-6 py-4">
          <MonitorSmartphone className="h-5 w-5 text-royal" />
          <h2 className="text-lg font-semibold text-navy">Active Sessions</h2>
        </div>
        {sessionsLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner label="Loading sessions..." />
          </div>
        ) : sessionsError ? (
          <div className="p-8 text-center">
            <p className="font-semibold text-navy">Could not load sessions.</p>
            <p className="mt-1 text-sm text-slate-500">{sessionsError}</p>
            <button
              onClick={loadSessions}
              className="mt-4 rounded-xl bg-royal px-4 py-2 text-sm font-semibold text-white hover:bg-navy"
            >
              Retry
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No active sessions" message="No sessions are currently recorded." />
          </div>
        ) : (
          <DataTable
            keyField="id"
            data={sessions}
            columns={[
              {
                key: "device",
                label: "Device",
                render: (s: SessionRow) => (
                  <span className="text-sm text-slate-700" title={s.userAgent ?? ""}>
                    {describeDevice(s.userAgent)}
                  </span>
                ),
              },
              {
                key: "ipAddress",
                label: "IP",
                render: (s: SessionRow) => (
                  <span className="font-mono text-xs text-slate-500">{s.ipAddress ?? "—"}</span>
                ),
              },
              {
                key: "createdAt",
                label: "Signed in",
                render: (s: SessionRow) => (
                  <span className="whitespace-nowrap text-xs" title={formatDateTime(s.createdAt)}>
                    {timeAgo(s.createdAt)}
                  </span>
                ),
              },
              {
                key: "expiresAt",
                label: "Expires",
                render: (s: SessionRow) => (
                  <span className="whitespace-nowrap text-xs" title={formatDateTime(s.expiresAt)}>
                    {formatDateTime(s.expiresAt)}
                  </span>
                ),
              },
              {
                key: "current",
                label: "",
                render: (s: SessionRow) =>
                  s.current ? <Badge tone="success">Current</Badge> : null,
              },
              {
                key: "actions",
                label: "Actions",
                render: (s: SessionRow) =>
                  s.current ? (
                    <span className="text-xs text-slate-400">This device</span>
                  ) : (
                    <button
                      onClick={() => revokeSession(s.id)}
                      className="rounded-lg border border-college/30 px-2.5 py-1.5 text-xs font-medium text-college hover:bg-college hover:text-white"
                    >
                      Revoke
                    </button>
                  ),
              },
            ]}
          />
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-royal" />
            <h2 className="text-lg font-semibold text-navy">Change Password</h2>
          </div>
          <div className="space-y-4">
            <FormField label="Current password">
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>
            <FormField label="New password" hint="Minimum 8 characters.">
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-navy"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FormField>
            <FormField label="Confirm new password" error={pwError ?? undefined}>
              <input
                type={showNew ? "text" : "password"}
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
              />
            </FormField>
            <div className="flex justify-end">
              <button
                onClick={changePassword}
                disabled={changing || !currentPassword || !newPassword || !confirmNewPassword}
                className="rounded-xl bg-royal px-4 py-2 text-sm font-semibold text-white hover:bg-navy disabled:opacity-50"
              >
                {changing ? "Updating..." : "Update password"}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <LogIn className="h-5 w-5 text-royal" />
            <h2 className="text-lg font-semibold text-navy">Recent Login Events</h2>
          </div>
          {loginsLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner label="Loading login events..." />
            </div>
          ) : logins.length === 0 ? (
            <EmptyState title="No login events" message="Recent sign-ins will appear here." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {logins.map((e) => (
                <li key={e.id} className="flex items-start justify-between gap-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {e.actor?.name ?? "Unknown user"}
                      <span className="ml-2 font-mono text-xs text-royal">{e.action}</span>
                    </p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">
                      {e.ipAddress ?? "IP unknown"}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400" title={formatDateTime(e.createdAt)}>
                    {timeAgo(e.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSecurityPage() {
  return (
    <ToastProvider>
      <SecurityInner />
    </ToastProvider>
  );
}
