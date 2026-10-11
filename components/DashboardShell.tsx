"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bell,
  Briefcase,
  CalendarCheck,
  ClipboardList,
  FolderOpen,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  Menu,
  ScrollText,
  Settings,
  ShieldCheck,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import Logo from "./Logo";
import Badge from "./Badge";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/roles";

/**
 * Icon registry for sidebar navigation. Layouts (server components) pass
 * string keys — never component references — because functions cannot cross
 * the server → client component boundary.
 */
const NAV_ICONS = {
  dashboard: LayoutDashboard,
  profile: User,
  notices: Bell,
  tasks: ClipboardList,
  records: FolderOpen,
  attendance: CalendarCheck,
  examinations: GraduationCap,
  help: LifeBuoy,
  password: KeyRound,
  students: Users,
  reports: BarChart3,
  tools: Wrench,
  academic: GraduationCap,
  settings: Settings,
  management: Briefcase,
  roles: ShieldCheck,
  audit: ScrollText,
  security: Lock,
} as const;

export type NavIconKey = keyof typeof NAV_ICONS;

export type NavItem = {
  href: string;
  label: string;
  icon: NavIconKey;
};

type DashboardShellProps = {
  title: string;
  navItems: NavItem[];
  accent: "student" | "management" | "admin";
  children: ReactNode;
};

type MeUser = {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "MANAGEMENT" | "ADMIN";
};

const ACCENT = {
  student: {
    sidebar: "bg-navy",
    active: "bg-brand text-white shadow",
    inactive: "text-slate-300 hover:bg-white/10 hover:text-white",
    topbarAccent: "text-brand",
  },
  management: {
    sidebar: "bg-navy",
    active: "bg-brand text-white shadow",
    inactive: "text-slate-300 hover:bg-white/10 hover:text-white",
    topbarAccent: "text-brand",
  },
  admin: {
    sidebar: "bg-navy-deep",
    active: "bg-royal text-white shadow",
    inactive: "text-slate-300 hover:bg-white/10 hover:text-white",
    topbarAccent: "text-royal",
  },
} as const;

const ROLE_BADGE_TONE = {
  STUDENT: "green",
  MANAGEMENT: "blue",
  ADMIN: "gold",
} as const;

export default function DashboardShell({
  title,
  navItems,
  accent,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<MeUser | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((res) => {
        if (!res.ok) throw new Error("unauthenticated");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setUser(data.user);
      })
      .catch(() => {
        if (!cancelled) window.location.href = "/login";
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
    } finally {
      window.location.href = "/login";
    }
  };

  const theme = ACCENT[accent];

  const nav = (
    <nav className="flex flex-col gap-1 px-4 py-6" aria-label="Dashboard">
      {navItems.map((item) => {
        const Icon = NAV_ICONS[item.icon];
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setDrawerOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium transition",
              active ? theme.active : theme.inactive,
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-mist">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden w-64 flex-col lg:flex",
          theme.sidebar,
        )}
      >
        <div className="px-5 pb-2 pt-6">
          <Logo size={40} showText />
        </div>
        <div className="flex-1 overflow-y-auto">{nav}</div>
        <div className="border-t border-white/10 p-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
          >
            <LogOut className="h-5 w-5" />
            {loggingOut ? "Signing out…" : "Sign Out"}
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside
            className={cn(
              "absolute inset-y-0 left-0 flex w-72 flex-col shadow-2xl",
              theme.sidebar,
            )}
          >
            <div className="flex items-center justify-between px-5 pb-2 pt-6">
              <Logo size={36} />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 text-white hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{nav}</div>
            <div className="border-t border-white/10 p-4">
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-60"
              >
                <LogOut className="h-5 w-5" />
                {loggingOut ? "Signing out…" : "Sign Out"}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="min-w-0 flex-1 truncate text-lg font-bold text-navy sm:text-xl">
            {title}
          </h1>
          {user && (
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden max-w-40 truncate text-sm font-medium text-slate-700 sm:block">
                {user.name}
              </span>
              <Badge tone={ROLE_BADGE_TONE[user.role]}>
                {ROLE_LABELS[user.role]}
              </Badge>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60 lg:flex"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
