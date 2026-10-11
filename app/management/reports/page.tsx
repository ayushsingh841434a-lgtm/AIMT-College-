"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, FileText, Plus } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import FormField from "@/components/FormField";
import { ToastProvider, useToast } from "@/components/Toast";

type Report = {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  generator: { name: string };
};

type ReportDetail = Report & {
  parameters: unknown;
  data: unknown;
};

const REPORT_TYPES = [
  { type: "students-by-branch", label: "Students by Branch", hint: "Count of students per branch." },
  { type: "students-by-year", label: "Students by Year", hint: "Count of students per academic year." },
  { type: "task-completion", label: "Task Completion", hint: "Tasks by status across students." },
  { type: "notices", label: "Notice Engagement", hint: "Notices with read counts." },
];

function renderData(data: unknown) {
  if (data == null) return <EmptyState title="No data" message="This report has no data." />;
  if (Array.isArray(data)) {
    if (data.length === 0) return <EmptyState title="No data" message="This report has no data." />;
    const keys = Object.keys(data[0] as Record<string, unknown>);
    return (
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-mist text-xs uppercase tracking-wide text-slate-500">
              {keys.map((k) => (
                <th key={k} className="px-4 py-2.5 font-semibold">
                  {k}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                {keys.map((k) => (
                  <td key={k} className="px-4 py-2.5 text-slate-700">
                    {String((row as Record<string, unknown>)[k] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (typeof data === "object") {
    return (
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {Object.entries(data as Record<string, unknown>).map(([k, v]) => (
          <div key={k} className="rounded-xl bg-mist px-4 py-3">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{k}</dt>
            <dd className="mt-1 text-lg font-bold text-navy">{String(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return <p className="text-sm text-slate-600">{String(data)}</p>;
}

function ReportsPage() {
  const { toast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [genOpen, setGenOpen] = useState(false);
  const [genType, setGenType] = useState(REPORT_TYPES[0]!.type);
  const [genTitle, setGenTitle] = useState("");
  const [generating, setGenerating] = useState(false);

  const [viewing, setViewing] = useState<ReportDetail | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?page=${page}&pageSize=10`, {
        credentials: "same-origin",
      });
      if (!res.ok) throw new Error("Could not load reports.");
      const body = await res.json();
      setReports(body.data ?? []);
      setTotalPages(body.totalPages ?? 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load reports.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast, page]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          type: genType,
          title: genTitle.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not generate the report.");
      toast("Report generated.", "success");
      setGenOpen(false);
      setGenTitle("");
      setPage(1);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not generate the report.", "error");
    } finally {
      setGenerating(false);
    }
  };

  const viewReport = async (id: string) => {
    setViewLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load the report.");
      setViewing(await res.json());
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load the report.", "error");
    } finally {
      setViewLoading(false);
    }
  };

  const columns: DataTableColumn<Report>[] = [
    { key: "title", label: "Title", sortable: true },
    {
      key: "type",
      label: "Type",
      render: (r) => <Badge tone="blue">{r.type}</Badge>,
    },
    {
      key: "createdAt",
      label: "Generated",
      render: (r) =>
        new Date(r.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <button
          type="button"
          onClick={() => viewReport(r.id)}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-brand hover:bg-blue-50"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-slate-500">
          Generate analytical reports from live database data. Every generated report is saved
          and can be revisited below.
        </p>
        <button
          type="button"
          onClick={() => setGenOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Generate Report
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {REPORT_TYPES.map((t) => (
          <button
            key={t.type}
            type="button"
            onClick={() => {
              setGenType(t.type);
              setGenOpen(true);
            }}
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-brand hover:shadow"
          >
            <BarChart3 className="h-6 w-6 text-brand" />
            <p className="mt-3 font-semibold text-navy">{t.label}</p>
            <p className="mt-1 text-sm text-slate-500">{t.hint}</p>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-navy">
          <FileText className="h-5 w-5" /> Report History
        </h2>
        {loading || viewLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={reports}
              keyField="id"
              emptyMessage="No reports generated yet."
            />
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <Modal open={genOpen} onClose={() => setGenOpen(false)} title="Generate Report">
        <form onSubmit={generate} className="space-y-4">
          <FormField label="Report type">
            <select
              value={genType}
              onChange={(e) => setGenType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              {REPORT_TYPES.map((t) => (
                <option key={t.type} value={t.type}>
                  {t.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Title (optional)" hint="Defaults to the report type and date.">
            <input
              value={genTitle}
              onChange={(e) => setGenTitle(e.target.value)}
              maxLength={200}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              placeholder="e.g. Branch-wise strength — Oct 2026"
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setGenOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={generating}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {generating ? "Generating…" : "Generate"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={viewing !== null} onClose={() => setViewing(null)} title={viewing?.title ?? "Report"}>
        {viewing && (
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Generated {new Date(viewing.createdAt).toLocaleString("en-IN")} by{" "}
              {viewing.generator.name}
            </p>
            {renderData(viewing.data)}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <ReportsPage />
    </ToastProvider>
  );
}
