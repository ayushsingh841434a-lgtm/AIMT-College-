"use client";

import { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import FormField from "@/components/FormField";
import { ToastProvider, useToast } from "@/components/Toast";

type Profile = {
  phone: string | null;
  address: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
};

function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>({ phone: null, address: null, guardianName: null, guardianPhone: null });
  const [saving, setSaving] = useState(false);

  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [changing, setChanging] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load your profile.");
      const body = await res.json();
      setName(body.user?.name ?? "");
      setEmail(body.user?.email ?? "");
      setProfile({
        phone: body.profile?.phone ?? null,
        address: body.profile?.address ?? null,
        guardianName: body.profile?.guardianName ?? null,
        guardianPhone: body.profile?.guardianPhone ?? null,
      });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load your profile.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          phone: profile.phone || undefined,
          address: profile.address || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save your profile.");
      toast("Profile updated.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save your profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) {
      toast("New passwords do not match.", "error");
      return;
    }
    setChanging(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ currentPassword: cur, newPassword: next, confirmNewPassword: confirm }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not change your password.");
      toast("Password changed. Other sessions were signed out.", "success");
      setCur("");
      setNext("");
      setConfirm("");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not change your password.", "error");
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-bold text-navy">My Profile</h2>
        <p className="mb-4 text-sm text-slate-500">
          Signed in as <span className="font-semibold text-navy">{name}</span> ({email}). Your
          name, email and role are managed by an administrator.
        </p>
        <form onSubmit={saveProfile} className="space-y-4">
          <FormField label="Phone">
            <input
              value={profile.phone ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value || null }))}
              maxLength={30}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              placeholder="+91-…"
            />
          </FormField>
          <FormField label="Address">
            <textarea
              value={profile.address ?? ""}
              onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value || null }))}
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
          </FormField>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-1 text-base font-bold text-navy">Change Password</h2>
        <p className="mb-4 text-sm text-slate-500">
          Use at least 8 characters with a letter and a digit.
        </p>
        <form onSubmit={changePassword} className="space-y-4">
          <FormField label="Current password">
            <input
              type="password"
              value={cur}
              onChange={(e) => setCur(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
          </FormField>
          <FormField label="New password">
            <input
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
          </FormField>
          <FormField label="Confirm new password">
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
          </FormField>
          <button
            type="submit"
            disabled={changing}
            className="rounded-xl bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-navy-deep disabled:opacity-60"
          >
            {changing ? "Changing…" : "Change Password"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <SettingsPage />
    </ToastProvider>
  );
}
