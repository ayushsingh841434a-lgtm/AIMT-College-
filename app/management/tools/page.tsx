"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, LifeBuoy, Plus, Trash2 } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import FormField from "@/components/FormField";
import { ToastProvider, useToast } from "@/components/Toast";

type Task = {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string | null;
  assignee: { id: string; name: string };
  creator: { name: string };
  createdAt: string;
};

type SupportRequest = {
  id: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED";
  createdAt: string;
  user: { name: string; email: string };
};

type StudentOption = { id: string; name: string; email: string; studentId: string | null };

function formatDate(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function ToolsPage() {
  const { toast } = useToast();

  // ---- tasks ----
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [taskPage, setTaskPage] = useState(1);
  const [taskTotalPages, setTaskTotalPages] = useState(1);
  const [taskStatus, setTaskStatus] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [tTitle, setTTitle] = useState("");
  const [tDesc, setTDesc] = useState("");
  const [tDue, setTDue] = useState("");
  const [tQuery, setTQuery] = useState("");
  const [tOptions, setTOptions] = useState<StudentOption[]>([]);
  const [tAssignee, setTAssignee] = useState("");
  const [creating, setCreating] = useState(false);

  // ---- support ----
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [supLoading, setSupLoading] = useState(true);
  const [supStatus, setSupStatus] = useState("");

  const loadTasks = useCallback(async () => {
    setTasksLoading(true);
    try {
      const params = new URLSearchParams({ page: String(taskPage), pageSize: "10" });
      if (taskStatus) params.set("status", taskStatus);
      const res = await fetch(`/api/tasks?${params}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load tasks.");
      const body = await res.json();
      setTasks(body.data ?? []);
      setTaskTotalPages(body.totalPages ?? 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load tasks.", "error");
    } finally {
      setTasksLoading(false);
    }
  }, [toast, taskPage, taskStatus]);

  const loadSupport = useCallback(async () => {
    setSupLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", pageSize: "20" });
      if (supStatus) params.set("status", supStatus);
      const res = await fetch(`/api/support-requests?${params}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load support requests.");
      const body = await res.json();
      setRequests(body.data ?? []);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load support requests.", "error");
    } finally {
      setSupLoading(false);
    }
  }, [toast, supStatus]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);
  useEffect(() => {
    loadSupport();
  }, [loadSupport]);

  // student picker for task assignment
  useEffect(() => {
    if (!createOpen) return;
    const q = tQuery.trim();
    if (q.length < 2) {
      setTOptions([]);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/students?q=${encodeURIComponent(q)}&pageSize=8`, {
          credentials: "same-origin",
        });
        if (res.ok) {
          const body = await res.json();
          setTOptions(body.data ?? []);
        }
      } catch {
        /* ignore picker errors */
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [tQuery, createOpen]);

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tAssignee) {
      toast("Please select a student to assign the task to.", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title: tTitle.trim(),
          description: tDesc.trim(),
          assignedTo: tAssignee,
          dueDate: tDue ? new Date(tDue).toISOString() : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not create the task.");
      toast("Task assigned.", "success");
      setCreateOpen(false);
      setTTitle("");
      setTDesc("");
      setTDue("");
      setTQuery("");
      setTAssignee("");
      setTaskPage(1);
      loadTasks();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not create the task.", "error");
    } finally {
      setCreating(false);
    }
  };

  const deleteTask = async (id: string) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE", credentials: "same-origin" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not delete the task.");
      toast("Task deleted.", "success");
      loadTasks();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete the task.", "error");
    }
  };

  const setRequestStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/support-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not update the request.");
      toast("Support request updated.", "success");
      loadSupport();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update the request.", "error");
    }
  };

  const taskColumns: DataTableColumn<Task>[] = [
    { key: "title", label: "Task", sortable: true },
    { key: "assignee", label: "Assigned to", render: (r) => r.assignee.name },
    {
      key: "status",
      label: "Status",
      render: (r) => (
        <Badge tone={r.status === "COMPLETED" ? "green" : r.status === "IN_PROGRESS" ? "blue" : "gold"}>
          {r.status.replace("_", " ")}
        </Badge>
      ),
    },
    { key: "dueDate", label: "Due", render: (r) => formatDate(r.dueDate) },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <button
          type="button"
          onClick={() => deleteTask(r.id)}
          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
          aria-label={`Delete ${r.title}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-navy">
            <ClipboardList className="h-5 w-5" /> Tasks & Assignments
          </h2>
          <div className="flex gap-2">
            <select
              value={taskStatus}
              onChange={(e) => {
                setTaskStatus(e.target.value);
                setTaskPage(1);
              }}
              className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
              aria-label="Filter tasks by status"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" /> Assign Task
            </button>
          </div>
        </div>
        {tasksLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <DataTable columns={taskColumns} data={tasks} keyField="id" emptyMessage="No tasks found." />
            <Pagination page={taskPage} totalPages={taskTotalPages} onChange={setTaskPage} />
          </>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-base font-bold text-navy">
            <LifeBuoy className="h-5 w-5" /> Support Requests
          </h2>
          <select
            value={supStatus}
            onChange={(e) => setSupStatus(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            aria-label="Filter support requests by status"
          >
            <option value="">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
        {supLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : requests.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-500">No support requests.</p>
        ) : (
          <ul className="space-y-3">
            {requests.map((r) => (
              <li key={r.id} className="rounded-xl border border-slate-100 bg-mist px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-navy">{r.subject}</p>
                    <p className="mt-1 text-sm text-slate-600">{r.message}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {r.user.name} ({r.user.email}) · {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <select
                    value={r.status}
                    onChange={(e) => setRequestStatus(r.id, e.target.value)}
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                    aria-label={`Status for ${r.subject}`}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In progress</option>
                    <option value="RESOLVED">Resolved</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Assign Task">
        <form onSubmit={createTask} className="space-y-4">
          <FormField label="Title">
            <input
              value={tTitle}
              onChange={(e) => setTTitle(e.target.value)}
              required
              minLength={3}
              maxLength={200}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              placeholder="e.g. Submit lab manual 4"
            />
          </FormField>
          <FormField label="Description">
            <textarea
              value={tDesc}
              onChange={(e) => setTDesc(e.target.value)}
              required
              minLength={10}
              rows={4}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              placeholder="What should the student do?"
            />
          </FormField>
          <FormField label="Assign to (search students)" hint="Type at least 2 characters, then pick a student.">
            <input
              value={tQuery}
              onChange={(e) => {
                setTQuery(e.target.value);
                setTAssignee("");
              }}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              placeholder="Search by name, email or ID…"
            />
            {tOptions.length > 0 && (
              <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                {tOptions.map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setTAssignee(s.id);
                        setTQuery(`${s.name} (${s.email})`);
                        setTOptions([]);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                    >
                      {s.name} · {s.studentId ?? s.email}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {tAssignee && <p className="mt-1 text-xs font-medium text-emerald-700">Student selected.</p>}
          </FormField>
          <FormField label="Due date (optional)">
            <input
              type="date"
              value={tDue}
              onChange={(e) => setTDue(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
          </FormField>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {creating ? "Assigning…" : "Assign Task"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <ToolsPage />
    </ToastProvider>
  );
}
