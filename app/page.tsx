import type { Metadata } from "next";
import Link from "next/link";
import { Megaphone, Users, FileText, GraduationCap, Info, Images, UserPlus } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Logo from "@/components/Logo";
import CampusImage from "@/components/CampusImage";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "AIMT — Ambalika Institute of Management and Technology",
  description:
    "Official portal of Ambalika Institute of Management and Technology, Lucknow, Uttar Pradesh.",
};

interface LandingStats {
  students: number | null;
  notices: number | null;
  programs: number | null;
}

interface LandingNotice {
  id: string;
  title: string;
  publishedAt: Date;
}

async function getLandingData(): Promise<{ stats: LandingStats | null; notices: LandingNotice[] }> {
  try {
    const [students, notices, branches, latest] = await Promise.all([
      db.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
      db.notice.count({ where: { audience: "ALL" } }),
      db.studentProfile.findMany({
        select: { branch: true },
        where: { branch: { not: null } },
        distinct: ["branch"],
      }),
      db.notice.findMany({
        where: { audience: "ALL" },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: { id: true, title: true, publishedAt: true },
      }),
    ]);
    return {
      stats: { students, notices, programs: branches.length },
      notices: latest,
    };
  } catch {
    return { stats: null, notices: [] };
  }
}

const QUICK_LINKS = [
  {
    href: "/about",
    icon: Info,
    title: "About the College",
    text: "Learn about AIMT's vision, mission, and the programs we offer.",
    accent: "bg-royal",
  },
  {
    href: "/gallery",
    icon: Images,
    title: "Campus Gallery",
    text: "Take a visual tour of our campus buildings, entrance, and gardens.",
    accent: "bg-leaf",
  },
  {
    href: "/register",
    icon: UserPlus,
    title: "Create Account",
    text: "Students can register here to get started with the college portal.",
    accent: "bg-college",
  },
];

export default async function LandingPage() {
  const { stats, notices } = await getLandingData();

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero */}
      <section className="relative">
        <CampusImage
          src="/images/aimt-campus-main.jpg"
          alt="AIMT campus — main academic buildings"
          className="h-[520px] w-full"
          imgClassName="object-cover"
          overlay
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <Logo size={84} className="drop-shadow-lg" />
          <h1 className="mt-5 max-w-4xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
            AMBALIKA INSTITUTE OF MANAGEMENT AND TECHNOLOGY
          </h1>
          <p className="mt-3 text-lg font-medium text-white/90">Lucknow, Uttar Pradesh</p>
          <p className="mt-4 max-w-2xl text-base text-white/85 sm:text-lg">
            The official management portal of Ambalika Institute of Management and Technology,
            Lucknow.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login"
              className="rounded-lg bg-brand px-8 py-3 text-base font-semibold text-white shadow-lg transition hover:bg-brand-dark"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="rounded-lg border-2 border-white/80 px-8 py-3 text-base font-semibold text-white transition hover:bg-white/10"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      {/* Welcome */}
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Welcome to AIMT</p>
          <h2 className="mt-2 text-3xl font-bold text-navy">
            Management &amp; Technology Education in Lucknow
          </h2>
          <div className="mt-5 space-y-4 text-slate-600">
            <p>
              Ambalika Institute of Management and Technology, located in Lucknow, Uttar Pradesh,
              offers programs in engineering, management, and computer applications.
            </p>
            <p>
              This portal is the digital front door for students, management, and administrators —
              handling admissions records, notices, tasks, attendance, examinations, and more in
              one place.
            </p>
          </div>
          <Link
            href="/about"
            className="mt-6 inline-flex items-center gap-2 font-semibold text-brand hover:text-brand-dark"
          >
            Learn more about the college
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <CampusImage
          src="/images/aimt-campus-main.jpg"
          alt="AIMT campus — main academic buildings"
          className="w-full overflow-hidden rounded-2xl shadow-xl"
          imgClassName="object-cover"
          caption="Main academic block, AIMT campus"
        />
      </section>

      {/* Stats band */}
      {stats && (
        <section className="bg-navy py-12">
          <div className="mx-auto max-w-7xl px-6">
            <p className="text-center text-sm font-semibold uppercase tracking-widest text-white/60">
              Portal at a glance
            </p>
            <div className="mt-6 grid gap-8 text-center sm:grid-cols-3">
              <div>
                <Users className="mx-auto h-8 w-8 text-gold" aria-hidden="true" />
                <p className="mt-3 text-4xl font-extrabold text-white">
                  {stats.students !== null ? stats.students.toLocaleString("en-IN") : "—"}
                </p>
                <p className="mt-1 text-sm font-medium text-white/70">Active Students</p>
              </div>
              <div>
                <Megaphone className="mx-auto h-8 w-8 text-gold" aria-hidden="true" />
                <p className="mt-3 text-4xl font-extrabold text-white">
                  {stats.notices !== null ? stats.notices.toLocaleString("en-IN") : "—"}
                </p>
                <p className="mt-1 text-sm font-medium text-white/70">Published Notices</p>
              </div>
              <div>
                <GraduationCap className="mx-auto h-8 w-8 text-gold" aria-hidden="true" />
                <p className="mt-3 text-4xl font-extrabold text-white">
                  {stats.programs !== null ? stats.programs : "—"}
                </p>
                <p className="mt-1 text-sm font-medium text-white/70">Programs</p>
              </div>
            </div>
            <p className="mt-8 text-center text-xs text-white/50">
              Live counts from the college database — portal data, updated as records change.
            </p>
          </div>
        </section>
      )}

      {/* Latest notices */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-navy">Latest Notices</h2>
          <Link href="/login" className="text-sm font-semibold text-brand hover:text-brand-dark">
            Sign in to view all
          </Link>
        </div>
        {notices.length > 0 ? (
          <ul className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm">
            {notices.map((notice) => (
              <li key={notice.id} className="flex items-start gap-4 px-6 py-4">
                <FileText className="mt-1 h-5 w-5 shrink-0 text-brand" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-slate-800">{notice.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{formatDate(notice.publishedAt)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-mist px-6 py-10 text-center text-slate-500">
            Notices will appear here once published.
          </p>
        )}
      </section>

      {/* Quick links */}
      <section className="bg-mist py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-bold text-navy">Explore</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {QUICK_LINKS.map(({ href, icon: Icon, title, text, accent }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-2xl bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`inline-flex rounded-xl ${accent} p-3 text-white`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy group-hover:text-brand">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
