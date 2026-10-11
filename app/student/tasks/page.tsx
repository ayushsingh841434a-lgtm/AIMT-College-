"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, RefreshCw } from "lucide-react";
import TaskCard, { type TaskStatus } from "@/components/TaskCard";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ToastProvider, useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

interface ApiTask {
  id: string;
  title: string;
  description: string;
  status: string;
  dueDate: string;
  creator?: { name: string };
}

const TABS = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "IN_PROGRESS", label: "In Progress" },
  { key: "COMPLETED", label: "Completed" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function TasksContent() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [tab, setTab] = useState<TabKey>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (status: TabKey) => {
    setLoading(true);
    setError(null);
    try {
      const url =
        status === "all" ? "/api/tasks" : `/api/tasks?status=${status}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setTasks(json.data ?? []);
    } catch {
      setError("We could not load your tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(tab);
  }, [tab, load]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast("Task status updated", "success");
      load(tab);
    } catch {
      toast("Could not update the task", "error");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">My Tasks</h1>
        <p className="mt-1 text-sm text-slate-500">
          Tasks assigned to you by the college. Update the status as you make
          progress.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold transition",
              tab === t.key
                ? "bg-navy text-white"
                : "bg-white text-slate-600 shadow-sm hover:bg-mist"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingSpinner label="Loading tasks" />
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-sm font-medium text-navy">{error}</p>
          <button
            onClick={() => load(tab)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <EmptyState
            icon={ClipboardList}
            title="No tasks here"
            message={
              tab === "all"
                ? "You have no tasks assigned right now."
                : `You have no ${TABS.find((t) => t.key === tab)?.label.toLowerCase()} tasks.`
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((t) => (
            <TaskCard
              key={t.id}
              task={{
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status as TaskStatus,
                dueDate: t.dueDate,
                assigneeName: t.creator?.name,
              }}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function StudentTasksPage() {
  return (
    <ToastProvider>
      <TasksContent />
    </ToastProvider>
  );
}
