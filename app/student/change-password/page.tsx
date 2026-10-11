"use client";

import { useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import FormField from "@/components/FormField";
import { ToastProvider, useToast } from "@/components/Toast";

function ChangePasswordContent() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmNewPassword?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: typeof fieldErrors = {};
    if (!currentPassword) errs.currentPassword = "Enter your current password.";
    if (!newPassword) {
      errs.newPassword = "Enter a new password.";
    } else if (newPassword.length < 8) {
      errs.newPassword = "New password must be at least 8 characters.";
    } else if (newPassword === currentPassword) {
      errs.newPassword = "New password must be different from the current one.";
    }
    if (newPassword !== confirmNewPassword) {
      errs.confirmNewPassword = "Passwords do not match.";
    }
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(
          json?.message || json?.error || "Failed to change password"
        );
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setFieldErrors({});
      toast("Password changed successfully", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Change Password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose a strong password to keep your account secure.
        </p>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-navy">
          <KeyRound className="h-5 w-5 text-brand" /> Update your password
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Current password" error={fieldErrors.currentPassword}>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Enter your current password"
              className={inputClass}
            />
          </FormField>
          <FormField label="New password" error={fieldErrors.newPassword}>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="At least 8 characters"
              className={inputClass}
            />
          </FormField>
          <FormField
            label="Confirm new password"
            error={fieldErrors.confirmNewPassword}
          >
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Repeat the new password"
              className={inputClass}
            />
          </FormField>
          {error && (
            <p className="rounded-xl bg-college/10 px-3 py-2 text-sm font-medium text-college">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? "Changing password..." : "Change password"}
          </button>
        </form>
      </section>

      <p className="flex items-start gap-2 rounded-2xl bg-mist p-4 text-sm text-slate-500">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />
        <span>
          Changing your password signs you out of other devices. If you did not
          request this change, contact the college administration office
          immediately.
        </span>
      </p>
    </div>
  );
}

export default function StudentChangePasswordPage() {
  return (
    <ToastProvider>
      <ChangePasswordContent />
    </ToastProvider>
  );
}
