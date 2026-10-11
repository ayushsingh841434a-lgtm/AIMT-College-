import Link from "next/link";

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/gallery", label: "Gallery" },
  { href: "/login", label: "Sign In" },
  { href: "/register", label: "Create Account" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-navy-deep text-slate-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-serif text-lg font-bold text-white">
            Ambalika Institute of Management and Technology
          </p>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            Lucknow, Uttar Pradesh, India
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white">
            Quick Links
          </p>
          <ul className="mt-3 space-y-2">
            {QUICK_LINKS.map((link) => (
              <li key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="text-sm text-slate-400 transition hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-white">
            About This Portal
          </p>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">
            The official college management portal for students, faculty
            management, and administrators of AIMT.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <p className="text-center text-xs text-slate-500">
            &copy; 2026 Ambalika Institute of Management and Technology. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
