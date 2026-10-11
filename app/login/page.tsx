"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Logo from "@/components/Logo";
import CampusImage from "@/components/CampusImage";
import FormField from "@/components/FormField";
import LoadingSpinner from "@/components/LoadingSpinner";

function LoginForm() {
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "1";
  const nextParam = searchParams.get("next");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password, rememberMe }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Sign in failed. Please try again.");
        return;
      }
      let target: string = data.redirectTo ?? "/login";
      if (nextParam && nextParam.startsWith("/") && !nextParam.includes("//")) {
        target = nextParam;
      }
      window.location.href = target;
    } catch {
      setError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Left: campus imagery (desktop only) */}
      <div className="relative hidden w-1/2 lg:block">
        <CampusImage
          src="/images/aimt-campus-main.jpg"
          alt="AIMT campus"
          className="h-full w-full"
          imgClassName="object-cover"
          overlay
        />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <p className="text-xl font-bold text-white">
            AMBALIKA INSTITUTE OF MANAGEMENT AND TECHNOLOGY
          </p>
          <p className="mt-1 text-sm text-white/80">Lucknow, Uttar Pradesh</p>
          <blockquote className="mt-6 border-l-4 border-gold pl-4 text-lg italic text-white/90">
            “Education is the most powerful weapon which you can use to change the world.”
          </blockquote>
          <p className="mt-2 text-sm text-white/70">— Nelson Mandela</p>
        </div>
      </div>

      {/* Right: form panel */}
      <div className="flex w-full flex-col items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <Logo size={64} showText />
            <p className="mt-3 text-sm font-bold tracking-wide text-navy">
              AMBALIKA INSTITUTE OF MANAGEMENT AND TECHNOLOGY
            </p>
            <p className="mt-1 text-xs text-slate-500">Lucknow, Uttar Pradesh</p>
          </div>

          <h1 className="mt-8 text-center text-3xl font-bold text-navy">Welcome Back!</h1>
          <p className="mt-2 text-center text-sm text-slate-500">
            Securely access your college portal.
          </p>

          {registered && (
            <div
              role="status"
              className="mt-6 flex items-start gap-3 rounded-lg border border-leaf/30 bg-leaf/10 px-4 py-3 text-sm text-leaf"
            >
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Account created. Please sign in.</span>
            </div>
          )}

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
            <FormField label="Email / User ID">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </FormField>

            <FormField label="Password">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 px-4 py-2.5 pr-11 text-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </FormField>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-brand"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="font-medium text-brand hover:text-brand-dark">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-base font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <LoadingSpinner label="Signing in…" /> : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-brand hover:text-brand-dark">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading…" />}>
      <LoginForm />
    </Suspense>
  );
}
