"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, Plus, Search } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import FormField from "@/components/FormField";
import { ToastProvider, useToast } from "@/components/Toast";

type StudentRow = {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  status: "ACTIVE" | "INACTIVE";
  branch: string | null;
  year: number | null;
  course: string | null;
  createdAt: string;
};

type StudentDetail = {
  user: {
    id: string;
    name: string;
    email: string;
    studentId: string | null;
    status: string;
    createdAt: string;
  };
  profile: {
    phone: string | null;
    course: string | null;
    branch: string | null;
    year: number | null;
    semester: number | null;
    admissionYear: number | null;
    guardianName: string | null;
    guardianPhone: string | null;
    address: string | null;
  } | null;
  recentRecords: { id: string; type: string; title: string; createdAt: string }[];
  tasks: { id: string; title: string; status: string; dueDate: string | null }[];
};

const RECORD_TYPES = ["ACADEMIC", "ATTENDANCE", "FEE", "DISCIPLINARY", "OTHER"];

function StudentsPage() {
  const { toast } = useToast();
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [branch, setBranch] = useState("");
  const [year, setYear] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [recordOpen, setRecordOpen] = useState(false);
  const [recordType, setRecordType] = useState("ACADEMIC");
  const [recordTitle, setRecordTitle] = useState("");
  const [recordDetails, setRecordDetails] = useState("");
  const [savingRecord, setSavingRecord] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (q.trim()) params.set("q", q.trim());
      if (branch.trim()) params.set("branch", branch.trim());
      if (year) params.set("year", year);
      if (status) params.set("status", status);
      const res = await fetch(`/api/students?${params}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load students.");
      const body = await res.json();
      setRows(body.data ?? []);
      setTotal(body.total ?? 0);
      setTotalPages(body.totalPages ?? 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load students.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast, q, branch, year, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/students/${id}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load student details.");
      setDetail(await res.json());
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load student details.", "error");
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const submitRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSavingRecord(true);
    try {
      let details: unknown = undefined;
      if (recordDetails.trim()) {
        try {
          details = JSON.parse(recordDetails);
        } catch {
          throw new Error("Details must be valid JSON (or left empty).");
        }
      }
      const res = await fetch("/api/records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          studentId: selectedId,
          type: recordType,
          title: recordTitle.trim(),
          details,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save the record.");
      toast("Record added successfully.", "success");
      setRecordOpen(false);
      setRecordTitle("");
      setRecordDetails("");
      openDetail(selectedId);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save the record.", "error");
    } finally {
      setSavingRecord(false);
    }
  };

  const columns: DataTableColumn<StudentRow>[] = [
    { key: "name", label: "Name", sortable: true },
    { key: "studentId", label: "Student ID", render: (r) => r.studentId ?? "—" },
    { key: "email", label: "Email" },
    { key: "branch", label: "Branch", render: (r) => r.branch ?? "—" },
    { key: "year", label: "Year", render: (r) => (r.year ? `Year ${r.year}` : "—") },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Badge tone={r.status === "ACTIVE" ? "green" : "gray"}>{r.status}</Badge>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <button
          type="button"
          onClick={() => openDetail(r.id)}
          className="rounded-lg px-3 py-1.5 text-sm font-semibold text-brand hover:bg-blue-50"
        >
          View
        </button>
      ),
    },
  ];

  if (selectedId) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
        >
          <ArrowLeft className="h-4 w-4" /> Back to students
        </button>
        {detailLoading || !detail ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-navy">{detail.user.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {detail.user.email} · {detail.user.studentId ?? "No student ID"}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600">
                    <span>{detail.profile?.course ?? "—"} · {detail.profile?.branch ?? "—"}</span>
                    <span>Year {detail.profile?.year ?? "—"} · Sem {detail.profile?.semester ?? "—"}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setRecordOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4" /> Add Record
                </button>
              </div>
              <dl className="mt-5 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Phone", detail.profile?.phone ?? "—"],
                  ["Guardian", detail.profile?.guardianName ?? "—"],
                  ["Guardian phone", detail.profile?.guardianPhone ?? "—"],
                  ["Admission year", detail.profile?.admissionYear ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-mist px-4 py-3">
                    <dt className="text-xs font-medium text-slate-500">{k}</dt>
                    <dd className="mt-0.5 font-semibold text-navy">{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-base font-bold text-navy">Recent Records</h3>
                {detail.recentRecords.length === 0 ? (
                  <EmptyState title="No records" message="No records yet." />
                ) : (
                  <ul className="space-y-2">
                    {detail.recentRecords.map((r) => (
                      <li key={r.id} className="rounded-xl bg-mist px-4 py-3 text-sm">
                        <span className="font-semibold text-navy">{r.title}</span>
                        <span className="ml-2">
                          <Badge tone="blue">{r.type}</Badge>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-3 text-base font-bold text-navy">Assigned Tasks</h3>
                {detail.tasks.length === 0 ? (
                  <EmptyState title="No tasks" message="No tasks assigned." />
                ) : (
                  <ul className="space-y-2">
                    {detail.tasks.map((t) => (
                      <li key={t.id} className="rounded-xl bg-mist px-4 py-3 text-sm">
                        <span className="font-semibold text-navy">{t.title}</span>
                        <span className="ml-2">
                          <Badge tone={t.status === "COMPLETED" ? "green" : "gold"}>
                            {t.status.replace("_", " ")}
                          </Badge>
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}

        <Modal open={recordOpen} onClose={() => setRecordOpen(false)} title="Add Student Record">
          <form onSubmit={submitRecord} className="space-y-4">
            <FormField label="Record type">
              <select
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              >
                {RECORD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Title">
              <input
                value={recordTitle}
                onChange={(e) => setRecordTitle(e.target.value)}
                required
                minLength={3}
                maxLength={200}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                placeholder="e.g. Semester 3 fee receipt"
              />
            </FormField>
            <FormField label="Details (optional JSON)" hint="Extra structured data, e.g. {&quot;amount&quot;: 55000}">
              <textarea
                value={recordDetails}
                onChange={(e) => setRecordDetails(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-mono text-sm"
                placeholder='{"key": "value"}'
              />
            </FormField>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRecordOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingRecord}
                className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
              >
                {savingRecord ? "Saving…" : "Save Record"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search name, email or student ID…"
              className="w-full rounded-xl border border-slate-300 py-2.5 pl-10 pr-3 text-sm"
              aria-label="Search students"
            />
          </label>
          <input
            value={branch}
            onChange={(e) => {
              setBranch(e.target.value);
              setPage(1);
            }}
            placeholder="Branch (e.g. CSE)"
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            aria-label="Filter by branch"
          />
          <select
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            aria-label="Filter by year"
          >
            <option value="">All years</option>
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <option key={y} value={y}>
                Year {y}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm text-slate-500">
          {total} student{total === 1 ? "" : "s"} found
        </p>
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
              emptyMessage="No students match your filters."
            />
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <StudentsPage />
    </ToastProvider>
  );
}
