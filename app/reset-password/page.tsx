"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import Logo from "@/components/Logo";
import FormField from "@/components/FormField";
import LoadingSpinner from "@/components/LoadingSpinner";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError("Password must contain at least one letter and one digit.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmNewPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not reset your password. The link may have expired.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-mist">
      <div className="h-24 bg-navy" aria-hidden="true" />

      <div className="mx-auto -mt-16 max-w-lg px-6 pb-16">
        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="flex flex-col items-center text-center">
            <Logo size={64} showText />
            <h1 className="mt-4 text-2xl font-bold text-navy">Set a New Password</h1>
            <p className="mt-2 text-sm text-slate-500">
              Choose a new password for your account.
            </p>
          </div>

          {!token ? (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-lg border border-college/30 bg-college/10 px-4 py-3 text-sm text-college"
            >
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>
                This reset link is invalid or missing its token. Please request a new one from the{" "}
                <Link href="/forgot-password" className="font-semibold underline">
                  forgot password
                </Link>{" "}
                page.
              </span>
            </div>
          ) : success ? (
            <div className="mt-6">
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm text-leaf"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <span>Your password has been reset. You can now sign in with your new password.</span>
              </div>
              <Link
                href="/login"
                className="mt-6 block rounded-lg bg-brand px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-brand-dark"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-3 rounded-lg border border-college/30 bg-college/10 px-4 py-3 text-sm text-college"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                <FormField label="New Password" hint="At least 8 characters, with a letter and a digit.">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter a new password"
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </FormField>

                <FormField label="Confirm New Password">
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat the new password"
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </FormField>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-base font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <LoadingSpinner label="Resetting…" /> : "Reset Password"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-600">
                <Link href="/login" className="font-semibold text-brand hover:text-brand-dark">
                  ← Back to Sign In
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading…" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
