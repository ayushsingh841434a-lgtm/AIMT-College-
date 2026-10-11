import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import Logo from "@/components/Logo";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="flex justify-center">
          <Logo size={56} showText />
        </div>
        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-college/10">
          <ShieldAlert className="h-8 w-8 text-college" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-navy">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-500">
          You do not have permission to view this page.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="flex-1 rounded-lg bg-brand px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-dark"
          >
            Go to Login
          </Link>
          <Link
            href="/"
            className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
