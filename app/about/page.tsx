import type { Metadata } from "next";
import { Eye, Target, GraduationCap, MapPin, Mail, Phone } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CampusImage from "@/components/CampusImage";

export const metadata: Metadata = {
  title: "About the College",
  description:
    "About Ambalika Institute of Management and Technology, Lucknow — vision, mission, programs offered, and contact details.",
};

const PROGRAMS = [
  { name: "B.Tech — Computer Science", detail: "Computer Science & Engineering" },
  { name: "B.Tech — Information Technology", detail: "Information Technology" },
  { name: "B.Tech — Electronics & Communication", detail: "Electronics & Communication Engineering" },
  { name: "MBA", detail: "Master of Business Administration" },
  { name: "MCA", detail: "Master of Computer Applications" },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <SiteHeader />

      {/* Hero band */}
      <section className="bg-navy py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h1 className="text-4xl font-extrabold text-white">About the College</h1>
          <p className="mt-3 max-w-3xl text-white/75">
            Ambalika Institute of Management and Technology — Lucknow, Uttar Pradesh, India.
          </p>
        </div>
      </section>

      {/* Campus image + overview */}
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
        <CampusImage
          src="/images/aimt-campus-reception.jpg"
          alt="Reception lobby at AIMT Lucknow with the college shield"
          className="w-full overflow-hidden rounded-2xl shadow-xl"
          imgClassName="object-cover"
          caption="Reception, AIMT Lucknow"
        />
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-brand">Overview</p>
          <h2 className="mt-2 text-3xl font-bold text-navy">
            A Campus Built for Learning
          </h2>
          <div className="mt-5 space-y-4 text-slate-600">
            <p>
              Ambalika Institute of Management and Technology (AIMT) is a higher-education
              institution in Lucknow, Uttar Pradesh, with programs in engineering,
              management, and computer applications.
            </p>
            <p>
              The institute combines classroom learning with practical, industry-oriented
              training. Campus facilities and academic resources support a learning
              environment where students can explore, build, and grow.
            </p>
            <p>
              Beyond academics, AIMT encourages participation in technical societies, cultural
              events, and sports — developing graduates who are skilled, confident, and
              ready for professional life.
            </p>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="bg-mist py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="inline-flex rounded-xl bg-royal p-3 text-white">
                <Eye className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-navy">Our Vision</h3>
              <p className="mt-3 text-slate-600">
                To be a recognized center of learning in management and technology — an
                institution whose graduates shape industry, society, and the nation with
                competence and character.
              </p>
            </div>
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="inline-flex rounded-xl bg-leaf p-3 text-white">
                <Target className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-navy">Our Mission</h3>
              <p className="mt-3 text-slate-600">
                To provide quality, affordable education; to foster research, innovation, and
                industry collaboration; and to nurture ethical, employable professionals who
                contribute meaningfully to their communities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Programs */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-widest text-brand">Academics</p>
        <h2 className="mt-2 text-3xl font-bold text-navy">Programs Offered</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-500">
          Indicative list of programs. Contact the college office for the current list of
          approved programs and intake.
        </p>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map(({ name, detail }) => (
            <div key={name} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="inline-flex rounded-xl bg-brand p-3 text-white">
                <GraduationCap className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy">{name}</h3>
              <p className="mt-1 text-sm text-slate-500">{detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="bg-navy py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl font-bold text-white">Contact</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-navy-deep p-6">
              <MapPin className="h-6 w-6 text-gold" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-white">Address</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">
                Ambalika Institute of Management and Technology,
                <br />
                Lucknow, Uttar Pradesh, India
              </p>
            </div>
            <div className="rounded-2xl bg-navy-deep p-6">
              <Mail className="h-6 w-6 text-gold" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-white">Email</h3>
              <p className="mt-2 text-sm text-white/70">
                For admissions and general queries, please use the contact details shared in
                official college communications.
              </p>
            </div>
            <div className="rounded-2xl bg-navy-deep p-6">
              <Phone className="h-6 w-6 text-gold" aria-hidden="true" />
              <h3 className="mt-3 font-semibold text-white">Phone</h3>
              <p className="mt-2 text-sm text-white/70">
                Office hours: Monday to Saturday, 9:00 AM – 5:00 PM (IST).
              </p>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
