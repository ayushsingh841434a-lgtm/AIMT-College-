"use client";

import { useCallback, useEffect, useState } from "react";
import { UserPlus, KeyRound, Copy, Check } from "lucide-react";
import DataTable from "@/components/DataTable";
import Modal from "@/components/Modal";
import FormField from "@/components/FormField";
import Badge from "@/components/Badge";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { ToastProvider, useToast } from "@/components/Toast";
import { formatDate } from "@/lib/utils";

type StaffRow = {
  id: string;
  name: string;
  email: string;
  role: "MANAGEMENT" | "ADMIN";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
};

type ListResponse = { data: StaffRow[]; total: number };

function ManagementInner() {
  const { toast } = useToast();
  const [managers, setManagers] = useState<StaffRow[]>([]);
  const [admins, setAdmins] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [cName, setCName] = useState("");
  const [cEmail, setCEmail] = useState("");
  const [cPassword, setCPassword] = useState("");
  const [cRole, setCRole] = useState<"MANAGEMENT" | "ADMIN">("MANAGEMENT");
  const [creating, setCreating] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<StaffRow | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [resetNote, setResetNote] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mgmtRes, adminRes] = await Promise.all([
        fetch("/api/users?role=MANAGEMENT&page=1"),
        fetch("/api/users?role=ADMIN&page=1"),
      ]);
      if (!mgmtRes.ok || !adminRes.ok) throw new Error("Failed to load staff accounts.");
      const [mgmt, admin] = (await Promise.all([mgmtRes.json(), adminRes.json()])) as [
        ListResponse,
        ListResponse,
      ];
      setManagers(mgmt.data ?? []);
      setAdmins(admin.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load staff accounts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createAccount() {
    setCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cName.trim(),
          email: cEmail.trim().toLowerCase(),
          password: cPassword,
          role: cRole,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.reason || err.message || "Account creation failed.");
      }
      toast("Account created. Share credentials securely with the staff member.", "success");
      setCreateOpen(false);
      setCName("");
      setCEmail("");
      setCPassword("");
      setCRole("MANAGEMENT");
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Account creation failed.", "error");
    } finally {
      setCreating(false);
    }
  }

  function openReset(target: StaffRow) {
    setResetTarget(target);
    setResetUrl(null);
    setResetNote(null);
    setCopied(false);
    setResetOpen(true);
  }

  async function generateResetLink() {
    if (!resetTarget) return;
    setResetting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetTarget.email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.reason || "Could not generate a reset link.");
      if (body.resetUrl) {
        setResetUrl(body.resetUrl as string);
        toast("Reset link generated.", "success");
      } else {
        setResetNote("Reset link sent (check server/email setup).");
        toast("Reset link sent.", "success");
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not generate a reset link.", "error");
    } finally {
      setResetting(false);
    }
  }

  async function copyResetUrl() {
    if (!resetUrl) return;
    try {
      await navigator.clipboard.writeText(resetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy to clipboard.", "error");
    }
  }

  const staffColumns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Status",
      render: (u: StaffRow) =>
        u.status === "ACTIVE" ? <Badge tone="success">Active</Badge> : <Badge tone="warning">Inactive</Badge>,
    },
    { key: "createdAt", label: "Created", render: (u: StaffRow) => formatDate(u.createdAt) },
    {
      key: "actions",
      label: "Actions",
      render: (u: StaffRow) => (
        <button
          onClick={() => openReset(u)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-navy hover:border-royal hover:text-royal"
        >
          <KeyRound className="h-3.5 w-3.5" /> Generate reset link
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy">Management Accounts</h1>
          <p className="mt-1 text-sm text-slate-500">
            Staff accounts with management or administrator access.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-royal px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy"
        >
          <UserPlus className="h-4 w-4" /> Create Staff Account
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <LoadingSpinner label="Loading staff accounts..." />
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="font-semibold text-navy">Could not load staff accounts.</p>
          <p className="mt-1 text-sm text-slate-500">{error}</p>
          <button
            onClick={load}
            className="mt-4 rounded-xl bg-royal px-4 py-2 text-sm font-semibold text-white hover:bg-navy"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-navy">
                Management Staff <span className="ml-1 text-sm font-normal text-slate-400">({managers.length})</span>
              </h2>
            </div>
            {managers.length === 0 ? (
              <div className="p-8">
                <EmptyState title="No management accounts" message="Create the first staff account to get started." />
              </div>
            ) : (
              <DataTable keyField="id" data={managers} columns={staffColumns} />
            )}
          </div>

          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-navy">
                Administrators <span className="ml-1 text-sm font-normal text-slate-400">({admins.length})</span>
              </h2>
            </div>
            {admins.length === 0 ? (
              <div className="p-8">
                <EmptyState title="No administrator accounts" message="At least one administrator should exist." />
              </div>
            ) : (
              <DataTable keyField="id" data={admins} columns={staffColumns} />
            )}
          </div>
        </>
      )}

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Staff Account">
        <div className="space-y-4">
          <FormField label="Full name">
            <input
              value={cName}
              onChange={(e) => setCName(e.target.value)}
              placeholder="e.g. Priya Sharma"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
            />
          </FormField>
          <FormField label="Email">
            <input
              type="email"
              value={cEmail}
              onChange={(e) => setCEmail(e.target.value)}
              placeholder="name@aimt.edu"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
            />
          </FormField>
          <FormField label="Temporary password" hint="Minimum 8 characters. Ask the staff member to change it after first login.">
            <input
              type="password"
              value={cPassword}
              onChange={(e) => setCPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
            />
          </FormField>
          <FormField label="Role">
            <select
              value={cRole}
              onChange={(e) => setCRole(e.target.value as "MANAGEMENT" | "ADMIN")}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal"
            >
              <option value="MANAGEMENT">Management</option>
              <option value="ADMIN">Admin</option>
            </select>
          </FormField>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setCreateOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-mist"
            >
              Cancel
            </button>
            <button
              onClick={createAccount}
              disabled={creating || cName.trim() === "" || cEmail.trim() === "" || cPassword.length < 8}
              className="rounded-xl bg-royal px-4 py-2 text-sm font-semibold text-white hover:bg-navy disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create account"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Password Reset Link">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Generate a one-time password reset link for{" "}
            <span className="font-semibold text-navy">{resetTarget?.name}</span> ({resetTarget?.email}).
          </p>
          {resetUrl ? (
            <div className="rounded-xl bg-mist p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Reset link</p>
              <p className="break-all font-mono text-xs text-navy">{resetUrl}</p>
              <button
                onClick={copyResetUrl}
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-royal px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          ) : resetNote ? (
            <p className="rounded-xl bg-mist p-4 text-sm text-slate-600">{resetNote}</p>
          ) : (
            <button
              onClick={generateResetLink}
              disabled={resetting}
              className="rounded-xl bg-royal px-4 py-2 text-sm font-semibold text-white hover:bg-navy disabled:opacity-50"
            >
              {resetting ? "Generating..." : "Generate link"}
            </button>
          )}
          <p className="text-xs text-slate-400">
            Share the link privately with the staff member. It expires after first use or the configured timeout.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminManagementPage() {
  return (
    <ToastProvider>
      <ManagementInner />
    </ToastProvider>
  );
}
