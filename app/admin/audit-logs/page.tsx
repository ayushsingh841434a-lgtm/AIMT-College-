"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import DataTable from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import Badge from "@/components/Badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { formatDateTime } from "@/lib/utils";

type AuditRow = {
  id: string;
  action: string;
  actor: { name: string; email: string } | null;
  targetType: string | null;
  targetId: string | null;
  details: unknown;
  ipAddress: string | null;
  createdAt: string;
};

type ListResponse = {
  data: AuditRow[];
  page: number;
  totalPages: number;
  total: number;
};

function actionTone(action: string): "success" | "warning" | "danger" | "info" | undefined {
  const a = action.toLowerCase();
  if (a.includes("delete") || a.includes("deactivate") || a.includes("failed")) return "danger";
  if (a.includes("create") || a.includes("login") || a.includes("activate")) return "success";
  if (a.includes("update") || a.includes("change") || a.includes("role")) return "warning";
  return "info";
}

function summarizeDetails(details: unknown): string {
  if (details == null) return "—";
  if (typeof details === "string") return details.length > 80 ? `${details.slice(0, 80)}…` : details;
  try {
    const s = JSON.stringify(details);
    return s.length > 80 ? `${s.slice(0, 80)}…` : s;
  } catch {
    return "—";
  }
}

function fullDetails(details: unknown): string {
  if (details == null) return "";
  if (typeof details === "string") return details;
  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return "";
  }
}

export default function AdminAuditLogsPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [applied, setApplied] = useState({ action: "", from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (applied.action) params.set("action", applied.action);
      if (applied.from) params.set("from", applied.from);
      if (applied.to) params.set("to", applied.to);
      const res = await fetch(`/api/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load audit logs.");
      const body = (await res.json()) as ListResponse;
      setRows(body.data ?? []);
      setPage(body.page ?? 1);
      setTotalPages(body.totalPages ?? 1);
      setTotal(body.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [page, applied]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters() {
    setPage(1);
    setApplied({ action: action.trim(), from, to });
  }

  function clearFilters() {
    setAction("");
    setFrom("");
    setTo("");
    setPage(1);
    setApplied({ action: "", from: "", to: "" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Audit Logs</h1>
        <p className="mt-1 text-sm text-slate-500">
          Immutable record of administrative actions. {total} entr{total === 1 ? "y" : "ies"} total.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Action
            </label>
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. user.update, auth.login"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              From
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              To
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyFilters}
              className="rounded-xl bg-royal px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy"
            >
              Filter
            </button>
            <button
              onClick={clearFilters}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-mist"
            >
              Clear
            </button>
            <button
              onClick={load}
              title="Refresh"
              className="inline-flex items-center rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-mist"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner label="Loading audit logs..." />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="font-semibold text-navy">Could not load audit logs.</p>
            <p className="mt-1 text-sm text-slate-500">{error}</p>
            <button
              onClick={load}
              className="mt-4 rounded-xl bg-royal px-4 py-2 text-sm font-semibold text-white hover:bg-navy"
            >
              Retry
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8">
            <EmptyState title="No audit entries" message="Try adjusting your filters or date range." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              keyField="id"
              data={rows}
              columns={[
                {
                  key: "createdAt",
                  label: "Time",
                  render: (r: AuditRow) => (
                    <span className="whitespace-nowrap text-xs">{formatDateTime(r.createdAt)}</span>
                  ),
                },
                {
                  key: "actor",
                  label: "Actor",
                  render: (r: AuditRow) =>
                    r.actor ? (
                      <span>
                        <span className="block text-sm font-medium text-navy">{r.actor.name}</span>
                        <span className="block text-xs text-slate-500">{r.actor.email}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">System</span>
                    ),
                },
                {
                  key: "action",
                  label: "Action",
                  render: (r: AuditRow) => <Badge tone={actionTone(r.action)}>{r.action}</Badge>,
                },
                {
                  key: "target",
                  label: "Target",
                  render: (r: AuditRow) =>
                    r.targetType ? (
                      <span className="text-xs text-slate-600">
                        {r.targetType}
                        {r.targetId ? <span className="font-mono"> · {r.targetId}</span> : null}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    ),
                },
                {
                  key: "details",
                  label: "Details",
                  render: (r: AuditRow) => (
                    <span
                      className="block max-w-[220px] truncate text-xs text-slate-500"
                      title={fullDetails(r.details)}
                    >
                      {summarizeDetails(r.details)}
                    </span>
                  ),
                },
                {
                  key: "ipAddress",
                  label: "IP",
                  render: (r: AuditRow) => (
                    <span className="font-mono text-xs text-slate-500">{r.ipAddress ?? "—"}</span>
                  ),
                },
              ]}
            />
          </div>
        )}
      </div>

      {totalPages > 1 && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}
    </div>
  );
}
