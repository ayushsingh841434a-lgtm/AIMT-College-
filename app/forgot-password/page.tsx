"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";
import FormField from "@/components/FormField";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSubmitted(true);
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
            <h1 className="mt-4 text-2xl font-bold text-navy">Reset Your Password</h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter your account email and we&apos;ll send you a reset link.
            </p>
          </div>

          {submitted ? (
            <div className="mt-6">
              <div
                role="status"
                className="flex items-start gap-3 rounded-lg border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm text-leaf"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <span>
                  If an account exists for this email, a password reset link has been sent.
                </span>
              </div>
              <Link
                href="/login"
                className="mt-6 block rounded-lg bg-brand px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-brand-dark"
              >
                Back to Sign In
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
                <FormField label="Email Address">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </FormField>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-base font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? <LoadingSpinner label="Sending…" /> : "Send Reset Link"}
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
