"use client";

import { useCallback, useEffect, useState } from "react";
import FormField from "@/components/FormField";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ToastProvider, useToast } from "@/components/Toast";

type Settings = {
  siteName: string;
  supportEmail: string;
  allowRegistration: boolean;
  sessionDays: number;
};

function SettingsInner() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings>({
    siteName: "",
    supportEmail: "",
    allowRegistration: false,
    sessionDays: 7,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ siteName?: string; supportEmail?: string; sessionDays?: string }>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings.");
      const body = await res.json();
      setSettings({
        siteName: body.siteName ?? "",
        supportEmail: body.supportEmail ?? "",
        allowRegistration: Boolean(body.allowRegistration),
        sessionDays: Number(body.sessionDays ?? 7),
      });
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to load settings.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  function validate(): boolean {
    const next: typeof errors = {};
    if (settings.siteName.trim() === "") next.siteName = "Site name is required.";
    if (settings.supportEmail.trim() === "") {
      next.supportEmail = "Support email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.supportEmail.trim())) {
      next.supportEmail = "Enter a valid email address.";
    }
    if (!Number.isInteger(settings.sessionDays) || settings.sessionDays < 1 || settings.sessionDays > 30) {
      next.sessionDays = "Enter a whole number between 1 and 30.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteName: settings.siteName.trim(),
          supportEmail: settings.supportEmail.trim(),
          allowRegistration: settings.allowRegistration,
          sessionDays: settings.sessionDays,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.reason || err.message || "Failed to save settings.");
      }
      toast("Settings updated.", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Failed to save settings.", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <LoadingSpinner label="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">System Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Global configuration for the portal. Changes are audited.
        </p>
      </div>

      <div className="max-w-2xl rounded-2xl bg-white p-6 shadow-sm">
        <div className="space-y-5">
          <FormField label="Site name" error={errors.siteName}>
            <input
              value={settings.siteName}
              onChange={(e) => setSettings((s) => ({ ...s, siteName: e.target.value }))}
              placeholder="AIMT College Management System"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
            />
          </FormField>

          <FormField label="Support email" error={errors.supportEmail} hint="Shown on the login and help pages.">
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))}
              placeholder="support@aimt.edu"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
            />
          </FormField>

          <FormField
            label="Session duration (days)"
            error={errors.sessionDays}
            hint="How long a login session stays valid before the user must sign in again."
          >
            <input
              type="number"
              min={1}
              max={30}
              value={settings.sessionDays}
              onChange={(e) => setSettings((s) => ({ ...s, sessionDays: Number(e.target.value) }))}
              className="w-32 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-royal focus:ring-2 focus:ring-royal/20"
            />
          </FormField>

          <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
            <input
              id="allow-registration"
              type="checkbox"
              checked={settings.allowRegistration}
              onChange={(e) => setSettings((s) => ({ ...s, allowRegistration: e.target.checked }))}
              className="mt-1 h-4 w-4 accent-royal"
            />
            <div>
              <label htmlFor="allow-registration" className="text-sm font-medium text-navy">
                Allow public registration
              </label>
              <p className="mt-0.5 text-xs text-slate-500">
                When enabled, new users can create their own accounts from the login page. When disabled,
                accounts can only be created by an administrator.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={load}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-mist"
            >
              Reset
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-royal px-4 py-2 text-sm font-semibold text-white hover:bg-navy disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <ToastProvider>
      <SettingsInner />
    </ToastProvider>
  );
}
