"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck, Search, AlertTriangle, Save, RotateCcw } from "lucide-react";
import Badge from "@/components/Badge";
import FormField from "@/components/FormField";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { ToastProvider, useToast } from "@/components/Toast";

type Role = "STUDENT" | "MANAGEMENT" | "ADMIN";
const ROLES: Role[] = ["STUDENT", "MANAGEMENT", "ADMIN"];

type PermissionInfo = {
  key: string;
  label: string;
  description: string;
};

type UserHit = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
};

function roleLabel(role: Role) {
  return role === "ADMIN" ? "Admin" : role === "MANAGEMENT" ? "Management" : "Student";
}

function PermissionMatrix() {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<PermissionInfo[]>([]);
  const [saved, setSaved] = useState<Record<Role, string[]>>({
    STUDENT: [],
    MANAGEMENT: [],
    ADMIN: [],
  });
  const [draft, setDraft] = useState<Record<Role, string[]>>({
    STUDENT: [],
    MANAGEMENT: [],
    ADMIN: [],
  });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [savingRole, setSavingRole] = useState<Role | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await fetch("/api/roles/permissions");
      if (!res.ok) throw new Error("Could not load permissions.");
      const body = await res.json();
      const matrix = body.matrix as Record<Role, string[]>;
      setPermissions((body.permissions ?? []) as PermissionInfo[]);
      setSaved(matrix);
      setDraft(JSON.parse(JSON.stringify(matrix)) as Record<Role, string[]>);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load permissions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function toggle(role: Role, key: string) {
    if (role === "ADMIN" && key === "roles.assign") return; // safeguard: cannot remove
    setDraft((prev) => {
      const has = prev[role].includes(key);
      return {
        ...prev,
        [role]: has ? prev[role].filter((k) => k !== key) : [...prev[role], key],
      };
    });
  }

  function isDirty(role: Role) {
    const a = [...saved[role]].sort().join(",");
    const b = [...draft[role]].sort().join(",");
    return a !== b;
  }

  function resetRole(role: Role) {
    setDraft((prev) => ({ ...prev, [role]: [...saved[role]] }));
  }

  async function saveRole(role: Role) {
    setSavingRole(role);
    try {
      const res = await fetch("/api/roles/permissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, permissions: draft[role] }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Saving permissions failed.");
      }
      const matrix = body.matrix as Record<Role, string[]>;
      setSaved(matrix);
      setDraft(JSON.parse(JSON.stringify(matrix)) as Record<Role, string[]>);
      toast(`Permissions updated for ${roleLabel(role)}.`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Saving permissions failed.", "error");
    } finally {
      setSavingRole(null);
    }
  }

  if (loading) return <LoadingSpinner label="Loading permissions..." />;
  if (loadError) {
    return (
      <EmptyState
        title="Could not load permissions"
        message={loadError}
        action={
          <button
            onClick={load}
            className="rounded-xl bg-royal px-4 py-2 text-sm font-semibold text-white hover:bg-navy"
          >
            Retry
          </button>
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-navy">Permission Matrix</h2>
        <p className="mt-1 text-sm text-slate-500">
          Tick a box to grant a permission, untick to revoke it, then save the role. Changes take effect
          immediately and are recorded in the audit log.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-mist/60 text-left">
              <th className="px-4 py-3 font-semibold text-navy">Permission</th>
              {ROLES.map((role) => (
                <th key={role} className="px-4 py-3 text-center font-semibold text-navy">
                  <div className="flex flex-col items-center gap-2">
                    <span>{roleLabel(role)}</span>
                    <span className="flex gap-1">
                      <button
                        onClick={() => saveRole(role)}
                        disabled={!isDirty(role) || savingRole !== null}
                        title={`Save ${roleLabel(role)} permissions`}
                        className="flex items-center gap-1 rounded-lg bg-royal px-2 py-1 text-xs font-semibold text-white hover:bg-navy disabled:opacity-40"
                      >
                        <Save className="h-3 w-3" />
                        {savingRole === role ? "Saving..." : "Save"}
                      </button>
                      {isDirty(role) && (
                        <button
                          onClick={() => resetRole(role)}
                          title="Discard changes"
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-mist"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {permissions.map((p) => (
              <tr key={p.key} className="hover:bg-mist/40">
                <td className="px-4 py-3">
                  <span className="block font-medium text-slate-800">{p.label}</span>
                  <span className="block text-xs text-slate-500">{p.description}</span>
                  <span className="mt-0.5 block font-mono text-[11px] text-slate-400">{p.key}</span>
                </td>
                {ROLES.map((role) => {
                  const locked = role === "ADMIN" && p.key === "roles.assign";
                  const checked = draft[role].includes(p.key);
                  return (
                    <td key={role} className="px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={locked || savingRole !== null}
                        onChange={() => toggle(role, p.key)}
                        title={
                          locked
                            ? "The roles.assign permission cannot be removed from Administrators."
                            : `${checked ? "Revoke" : "Grant"} ${p.label} for ${roleLabel(role)}`
                        }
                        aria-label={`${p.label} for ${roleLabel(role)}`}
                        className="h-4 w-4 accent-royal disabled:cursor-not-allowed disabled:opacity-60"
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChangeUserRole() {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<UserHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [newRole, setNewRole] = useState<Role>("MANAGEMENT");
  const [changing, setChanging] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (term: string) => {
      const trimmed = term.trim();
      if (trimmed === "") {
        setHits([]);
        setSearched(false);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/users?q=${encodeURIComponent(trimmed)}&page=1`);
        if (!res.ok) throw new Error("Search failed.");
        const body = await res.json();
        setHits((body.data ?? []) as UserHit[]);
        setSearched(true);
      } catch {
        toast("User search failed.", "error");
      } finally {
        setSearching(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(query), 400);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [query, search]);

  const selected = hits.find((h) => h.id === selectedId);

  async function changeRole() {
    if (!selected) return;
    if (selected.role === newRole) {
      toast("The user already has this role.", "info");
      return;
    }
    if (
      !window.confirm(
        `Change ${selected.name} (${selected.email}) from ${roleLabel(selected.role)} to ${roleLabel(newRole)}?`
      )
    ) {
      return;
    }
    setChanging(true);
    try {
      const res = await fetch(`/api/users/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Role change failed.");
      }
      toast(`Role updated to ${roleLabel(newRole)}.`, "success");
      setHits((prev) => prev.map((h) => (h.id === selected.id ? { ...h, role: newRole } : h)));
    } catch (e) {
      toast(e instanceof Error ? e.message : "Role change failed.", "error");
    } finally {
      setChanging(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-royal" />
        <h2 className="text-lg font-semibold text-navy">Change User Role</h2>
      </div>

      <div className="mb-4 flex items-start gap-2 rounded-xl bg-gold/10 p-3 text-sm text-slate-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <p>
          You cannot change your own role or demote the last active administrator. Blocked changes are
          reported by the server and shown here.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Search user" hint="Type a name, email or student ID.">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
            />
          </div>
        </FormField>
        <FormField label="New role">
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as Role)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal"
          >
            <option value="STUDENT">Student</option>
            <option value="MANAGEMENT">Management</option>
            <option value="ADMIN">Admin</option>
          </select>
        </FormField>
      </div>

      <div className="mt-4">
        {searching ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <LoadingSpinner label="Searching..." />
          </div>
        ) : searched && hits.length === 0 ? (
          <p className="text-sm text-slate-500">No users matched your search.</p>
        ) : (
          <ul className="space-y-2">
            {hits.map((h) => (
              <li key={h.id}>
                <label
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition ${
                    selectedId === h.id ? "border-royal bg-royal/5" : "border-slate-200 hover:border-royal/50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="role-user"
                      checked={selectedId === h.id}
                      onChange={() => setSelectedId(h.id)}
                      className="accent-royal"
                    />
                    <span>
                      <span className="block text-sm font-medium text-navy">{h.name}</span>
                      <span className="block text-xs text-slate-500">{h.email}</span>
                    </span>
                  </span>
                  <Badge tone={h.role === "ADMIN" ? "red" : h.role === "MANAGEMENT" ? "blue" : "gray"}>
                    {roleLabel(h.role)}
                  </Badge>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={changeRole}
          disabled={!selected || changing}
          className="rounded-xl bg-royal px-4 py-2 text-sm font-semibold text-white hover:bg-navy disabled:opacity-50"
        >
          {changing ? "Updating..." : "Change role"}
        </button>
      </div>
    </div>
  );
}

export default function AdminRolesPage() {
  return (
    <ToastProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-navy">Roles &amp; Permissions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Grant or revoke permissions per role, and change user roles safely.
          </p>
        </div>
        <PermissionMatrix />
        <ChangeUserRole />
      </div>
    </ToastProvider>
  );
}
