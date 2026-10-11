"use client";

import { useCallback, useEffect, useState } from "react";
import DataTable, { type DataTableColumn } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import { CalendarCheck, CalendarX2, Percent } from "lucide-react";
import { ToastProvider, useToast } from "@/components/Toast";

type Attendance = {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LEAVE";
  subject: string;
};

function AttendancePage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [subject, setSubject] = useState("");
  const [summary, setSummary] = useState({ total: 0, present: 0, percentage: 0 });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "15" });
      if (subject.trim()) params.set("subject", subject.trim());
      const res = await fetch(`/api/attendance?${params}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load attendance.");
      const body = await res.json();
      setRows(body.data ?? []);
      setTotalPages(body.totalPages ?? 1);
      setSummary(body.summary ?? { total: 0, present: 0, percentage: 0 });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load attendance.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast, page, subject]);

  useEffect(() => {
    load();
  }, [load ]);

  const columns: DataTableColumn<Attendance>[] = [
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (r) =>
        new Date(r.date).toLocaleDateString("en-IN", {
          weekday: "short",
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    },
    { key: "subject", label: "Subject", sortable: true },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Badge
          tone={r.status === "PRESENT" ? "green" : r.status === "ABSENT" ? "red" : "gold"}
        >
          {r.status}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Classes Marked" value={summary.total} icon={CalendarCheck} tone="blue" />
        <StatCard label="Present" value={summary.present} icon={CalendarCheck} tone="green" />
        <StatCard
          label="Attendance %"
          value={`${summary.percentage}%`}
          icon={Percent}
          tone={summary.percentage >= 75 ? "green" : "red"}
          sub="Based on marked attendance records"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-navy">
            <CalendarX2 className="h-5 w-5" /> Attendance History
          </h2>
          <input
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by subject…"
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            aria-label="Filter by subject"
          />
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={rows}
              keyField="id"
              emptyMessage="No attendance records yet."
            />
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
        <p className="mt-3 text-xs text-slate-400">
          Attendance is marked by the college management. If a day looks wrong, please contact
          support from the Help & Support page.
        </p>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <AttendancePage />
    </ToastProvider>
  );
}
