"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import FormField from "@/components/FormField";
import { ToastProvider, useToast } from "@/components/Toast";

type Notice = {
  id: string;
  title: string;
  body: string;
  audience: "ALL" | "STUDENT" | "MANAGEMENT";
  publishedAt: string;
  publisher: { name: string };
};

const AUDIENCES = ["ALL", "STUDENT", "MANAGEMENT"] as const;

function NoticesPage() {
  const { toast } = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [audienceFilter, setAudienceFilter] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<(typeof AUDIENCES)[number]>("ALL");
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState<Notice | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "10" });
      if (audienceFilter) params.set("audience", audienceFilter);
      const res = await fetch(`/api/notices?${params}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load notices.");
      const data = await res.json();
      setNotices(data.data ?? []);
      setTotalPages(data.totalPages ?? 1);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load notices.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast, page, audienceFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openEditor = (notice: Notice | null) => {
    setEditing(notice);
    setTitle(notice?.title ?? "");
    setBody(notice?.body ?? "");
    setAudience(notice?.audience ?? "ALL");
    setEditorOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const url = editing ? `/api/notices/${editing.id}` : "/api/notices";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ title: title.trim(), body: body.trim(), audience }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not save the notice.");
      toast(editing ? "Notice updated." : "Notice published.", "success");
      setEditorOpen(false);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save the notice.", "error");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/notices/${deleting.id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not delete the notice.");
      toast("Notice deleted.", "success");
      setDeleting(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete the notice.", "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  const columns: DataTableColumn<Notice>[] = [
    { key: "title", label: "Title", sortable: true },
    {
      key: "audience",
      label: "Audience",
      render: (r) => <Badge tone="blue">{r.audience}</Badge>,
    },
    {
      key: "publishedAt",
      label: "Published",
      render: (r) =>
        new Date(r.publishedAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        }),
    },
    { key: "publisher", label: "By", render: (r) => r.publisher.name },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => openEditor(r)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-navy"
            aria-label={`Edit ${r.title}`}
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDeleting(r)}
            className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
            aria-label={`Delete ${r.title}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <select
          value={audienceFilter}
          onChange={(e) => {
            setAudienceFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
          aria-label="Filter by audience"
        >
          <option value="">All audiences</option>
          {AUDIENCES.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => openEditor(null)}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Publish Notice
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={notices}
              keyField="id"
              emptyMessage="No notices yet."
            />
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? "Edit Notice" : "Publish Notice"}
      >
        <form onSubmit={save} className="space-y-4">
          <FormField label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              minLength={3}
              maxLength={200}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              placeholder="Notice headline"
            />
          </FormField>
          <FormField label="Body">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              minLength={10}
              rows={6}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              placeholder="Full notice text…"
            />
          </FormField>
          <FormField label="Audience">
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as (typeof AUDIENCES)[number])}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {a === "ALL" ? "Everyone" : a === "STUDENT" ? "Students" : "Management"}
                </option>
              ))}
            </select>
          </FormField>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : editing ? "Save Changes" : "Publish"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete notice?"
      >
        <p className="text-sm text-slate-600">
          “{deleting?.title}” will be permanently removed for all audiences.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => setDeleting(null)}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deleteBusy}
            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-60"
          >
            {deleteBusy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <NoticesPage />
    </ToastProvider>
  );
}
