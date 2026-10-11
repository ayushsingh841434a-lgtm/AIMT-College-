"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Power, Search } from "lucide-react";
import DataTable from "@/components/DataTable";
import Pagination from "@/components/Pagination";
import Modal from "@/components/Modal";
import FormField from "@/components/FormField";
import Badge from "@/components/Badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { ToastProvider, useToast } from "@/components/Toast";
import { formatDate } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string;
  email: string;
  studentId: string | null;
  role: "STUDENT" | "MANAGEMENT" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
};

type ListResponse = {
  data: UserRow[];
  page: number;
  totalPages: number;
  total: number;
};

function roleBadge(role: UserRow["role"]) {
  if (role === "ADMIN") return <Badge tone="danger">Admin</Badge>;
  if (role === "MANAGEMENT") return <Badge tone="info">Management</Badge>;
  return <Badge>Student</Badge>;
}

function statusBadge(status: UserRow["status"]) {
  return status === "ACTIVE" ? <Badge tone="success">Active</Badge> : <Badge tone="warning">Inactive</Badge>;
}

function UsersInner() {
  const { toast } = useToast();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<UserRow | null>(null);
  const [editName, setEditName] = useState("");
  const [editStudentId, setEditStudentId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (debouncedQ) params.set("q", debouncedQ);
      if (role) params.set("role", role);
      if (status) params.set("status", status);
      const res = await fetch(`/api/users?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load users.");
      const body = (await res.json()) as ListResponse;
      setRows(body.data ?? []);
      setPage(body.page ?? 1);
      setTotalPages(body.totalPages ?? 1);
      setTotal(body.total ?? 0);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQ, role, status]);

  useEffect(() => {
    load();
  }, [load]);

  function openEdit(user: UserRow) {
    setEditing(user);
    setEditName(user.name);
    setEditStudentId(user.studentId ?? "");
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          studentId: editStudentId.trim() === "" ? null : editStudentId.trim(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.reason || err.message || "Update failed.");
      }
      toast("User updated.", "success");
      setEditing(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Update failed.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user: UserRow) {
    const next = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const label = next === "ACTIVE" ? "activate" : "deactivate";
    if (!window.confirm(`Are you sure you want to ${label} ${user.name} (${user.email})?`)) return;
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.reason || err.message || "Status change failed.");
      }
      toast(`User ${label}d.`, "success");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Status change failed.", "error");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search, filter and manage every account in the system. {total} account{total === 1 ? "" : "s"} total.
        </p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email or student ID..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
            />
          </div>
          <select
            value={role}
            onChange={(e) => {
              setRole(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal"
          >
            <option value="">All roles</option>
            <option value="STUDENT">Student</option>
            <option value="MANAGEMENT">Management</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner label="Loading users..." />
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="font-semibold text-navy">Could not load users.</p>
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
            <EmptyState
              title="No users found"
              message="Try adjusting your search or filters."
            />
          </div>
        ) : (
          <DataTable
            keyField="id"
            data={rows}
            columns={[
              { key: "name", label: "Name", sortable: true },
              { key: "email", label: "Email", sortable: true },
              { key: "role", label: "Role", render: (u: UserRow) => roleBadge(u.role) },
              { key: "status", label: "Status", render: (u: UserRow) => statusBadge(u.status) },
              { key: "createdAt", label: "Created", render: (u: UserRow) => formatDate(u.createdAt) },
              {
                key: "actions",
                label: "Actions",
                render: (u: UserRow) => (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(u)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-navy hover:border-royal hover:text-royal"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => toggleStatus(u)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                        u.status === "ACTIVE"
                          ? "border-college/30 text-college hover:bg-college hover:text-white"
                          : "border-leaf/30 text-leaf hover:bg-leaf hover:text-white"
                      }`}
                    >
                      <Power className="h-3.5 w-3.5" />
                      {u.status === "ACTIVE" ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                ),
              },
            ]}
          />
        )}
      </div>

      {totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title="Edit User">
        <div className="space-y-4">
          <FormField label="Full name">
            <input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
            />
          </FormField>
          <FormField label="Student ID" hint="Only applicable to student accounts. Leave blank for staff.">
            <input
              value={editStudentId}
              onChange={(e) => setEditStudentId(e.target.value)}
              placeholder="e.g. AIMT2026001"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
            />
          </FormField>
          <p className="rounded-xl bg-mist p-3 text-xs text-slate-500">
            Role changes are handled separately under Roles &amp; Permissions.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditing(null)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-mist"
            >
              Cancel
            </button>
            <button
              onClick={saveEdit}
              disabled={saving || editName.trim() === ""}
              className="rounded-xl bg-royal px-4 py-2 text-sm font-semibold text-white hover:bg-navy disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ToastProvider>
      <UsersInner />
    </ToastProvider>
  );
}
