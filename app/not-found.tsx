import Link from "next/link";
import { SearchX } from "lucide-react";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="flex justify-center">
          <Logo size={56} showText />
        </div>
        <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10">
          <SearchX className="h-8 w-8 text-brand" aria-hidden="true" />
        </div>
        <p className="mt-4 text-5xl font-extrabold text-navy">404</p>
        <h1 className="mt-2 text-2xl font-bold text-navy">Page Not Found</h1>
        <p className="mt-2 text-sm text-slate-500">
          The page you are looking for does not exist.
        </p>
        <Link
          href="/"
          className="mt-8 block rounded-lg bg-brand px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
