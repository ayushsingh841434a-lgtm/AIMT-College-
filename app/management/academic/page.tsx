"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, GraduationCap, Megaphone, Trash2 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/Badge";
import FormField from "@/components/FormField";
import CampusImage from "@/components/CampusImage";
import { ToastProvider, useToast } from "@/components/Toast";
import { cn } from "@/lib/utils";

type Notice = { id: string; title: string; body: string; publishedAt: string };
type StudentOption = { id: string; name: string; studentId: string | null };
type AttendanceRow = { studentId: string; status: "PRESENT" | "ABSENT" | "LEAVE" };
type ExamRow = {
  id: string;
  examName: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
  grade: string | null;
  student: { name: string; studentId: string | null };
};

const TABS = [
  { id: "overview", label: "Overview", icon: Megaphone },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "exams", label: "Exam Results", icon: GraduationCap },
] as const;

type TabId = (typeof TABS)[number]["id"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function AcademicPage() {
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>("overview");

  // ---- overview ----
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);

  // ---- attendance ----
  const [attDate, setAttDate] = useState(todayISO());
  const [attSubject, setAttSubject] = useState("General");
  const [roster, setRoster] = useState<StudentOption[]>([]);
  const [marks, setMarks] = useState<Record<string, AttendanceRow["status"]>>({});
  const [rosterLoading, setRosterLoading] = useState(false);
  const [savingAtt, setSavingAtt] = useState(false);

  // ---- exams ----
  const [examStudentId, setExamStudentId] = useState("");
  const [examQuery, setExamQuery] = useState("");
  const [examOptions, setExamOptions] = useState<StudentOption[]>([]);
  const [examName, setExamName] = useState("");
  const [examSubject, setExamSubject] = useState("");
  const [examMarks, setExamMarks] = useState("");
  const [examMax, setExamMax] = useState("100");
  const [examGrade, setExamGrade] = useState("");
  const [savingExam, setSavingExam] = useState(false);
  const [exams, setExams] = useState<ExamRow[]>([]);
  const [examsLoading, setExamsLoading] = useState(true);

  const loadNotices = useCallback(async () => {
    setNoticesLoading(true);
    try {
      const res = await fetch("/api/notices?pageSize=10", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load notices.");
      const body = await res.json();
      setNotices(body.data ?? []);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load notices.", "error");
    } finally {
      setNoticesLoading(false);
    }
  }, [toast]);

  const loadRoster = useCallback(async () => {
    setRosterLoading(true);
    try {
      const res = await fetch("/api/students?pageSize=50", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load students.");
      const body = await res.json();
      const list: StudentOption[] = (body.data ?? []).map(
        (s: { id: string; name: string; studentId: string | null }) => ({
          id: s.id,
          name: s.name,
          studentId: s.studentId,
        }),
      );
      setRoster(list);
      // preload existing marks for the date/subject
      const att = await fetch(
        `/api/attendance?date=${attDate}&subject=${encodeURIComponent(attSubject)}&pageSize=100`,
        { credentials: "same-origin" },
      );
      if (att.ok) {
        const attBody = await att.json();
        const m: Record<string, AttendanceRow["status"]> = {};
        for (const r of attBody.data ?? []) m[r.studentId] = r.status;
        setMarks(m);
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load the roster.", "error");
    } finally {
      setRosterLoading(false);
    }
  }, [toast, attDate, attSubject]);

  const loadExams = useCallback(async () => {
    setExamsLoading(true);
    try {
      const res = await fetch("/api/exams?pageSize=15", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load exam results.");
      const body = await res.json();
      setExams(body.data ?? []);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load exam results.", "error");
    } finally {
      setExamsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadNotices();
    loadExams();
  }, [loadNotices, loadExams]);

  useEffect(() => {
    if (tab === "attendance") loadRoster();
  }, [tab, loadRoster]);

  // exam student picker
  useEffect(() => {
    const q = examQuery.trim();
    if (q.length < 2) {
      setExamOptions([]);
      return;
    }
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/students?q=${encodeURIComponent(q)}&pageSize=8`, {
          credentials: "same-origin",
        });
        if (res.ok) {
          const body = await res.json();
          setExamOptions(body.data ?? []);
        }
      } catch {
        /* ignore */
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [examQuery]);

  const saveAttendance = async () => {
    const entries = roster.map((s) => ({
      studentId: s.id,
      status: marks[s.id] ?? "PRESENT",
    }));
    setSavingAtt(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ date: attDate, subject: attSubject.trim() || "General", entries }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save attendance.");
      toast(`Attendance saved for ${body.saved} students.`, "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save attendance.", "error");
    } finally {
      setSavingAtt(false);
    }
  };

  const saveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examStudentId) {
      toast("Please select a student.", "error");
      return;
    }
    setSavingExam(true);
    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          studentId: examStudentId,
          examName: examName.trim(),
          subject: examSubject.trim(),
          marksObtained: Number(examMarks),
          maxMarks: Number(examMax),
          grade: examGrade.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not save the result.");
      toast("Exam result recorded.", "success");
      setExamStudentId("");
      setExamQuery("");
      setExamName("");
      setExamSubject("");
      setExamMarks("");
      setExamGrade("");
      loadExams();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not save the result.", "error");
    } finally {
      setSavingExam(false);
    }
  };

  const deleteExam = async (id: string) => {
    if (!window.confirm("Delete this exam result?")) return;
    try {
      const res = await fetch(`/api/exams/${id}`, { method: "DELETE", credentials: "same-origin" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Could not delete the result.");
      toast("Exam result deleted.", "success");
      loadExams();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not delete the result.", "error");
    }
  };

  return (
    <div className="space-y-6">
      <CampusImage
        src="/images/aimt-campus-library.jpg"
        alt="Central library at AIMT Lucknow"
        className="h-40 sm:h-48"
        caption="Academic blocks, library and laboratories — AIMT Lucknow"
        fallbackLabel="Academic Information — AIMT Lucknow"
      />

      <div className="flex gap-2 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                tab === t.id
                  ? "bg-navy text-white shadow"
                  : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50",
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-navy">Academic Notices</h2>
          {noticesLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : notices.length === 0 ? (
            <EmptyState title="No notices" message="No academic notices published yet." />
          ) : (
            <ul className="space-y-3">
              {notices.map((n) => (
                <li key={n.id} className="rounded-xl bg-mist px-4 py-3">
                  <p className="font-semibold text-navy">{n.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-600">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(n.publishedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Student academic details (course, branch, year, semester) are maintained on each
            student&apos;s profile and visible under Student Records.
          </p>
        </section>
      )}

      {tab === "attendance" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FormField label="Date">
              <input
                type="date"
                value={attDate}
                max={todayISO()}
                onChange={(e) => setAttDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              />
            </FormField>
            <FormField label="Subject">
              <input
                value={attSubject}
                onChange={(e) => setAttSubject(e.target.value)}
                maxLength={100}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                placeholder="e.g. Data Structures"
              />
            </FormField>
            <div className="flex items-end">
              <button
                type="button"
                onClick={saveAttendance}
                disabled={savingAtt || roster.length === 0}
                className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
              >
                {savingAtt ? "Saving…" : `Save Attendance (${roster.length})`}
              </button>
            </div>
          </div>
          {rosterLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : roster.length === 0 ? (
            <EmptyState title="No students" message="No students found." />
          ) : (
            <ul className="max-h-[28rem] space-y-2 overflow-y-auto pr-1">
              {roster.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-mist px-4 py-2.5"
                >
                  <span className="text-sm font-medium text-navy">
                    {s.name}
                    <span className="ml-2 text-xs text-slate-500">{s.studentId ?? ""}</span>
                  </span>
                  <div className="flex gap-1" role="radiogroup" aria-label={`Attendance for ${s.name}`}>
                    {(["PRESENT", "ABSENT", "LEAVE"] as const).map((st) => (
                      <button
                        key={st}
                        type="button"
                        role="radio"
                        aria-checked={(marks[s.id] ?? "PRESENT") === st}
                        onClick={() => setMarks((m) => ({ ...m, [s.id]: st }))}
                        className={cn(
                          "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                          (marks[s.id] ?? "PRESENT") === st
                            ? st === "PRESENT"
                              ? "bg-emerald-600 text-white"
                              : st === "ABSENT"
                                ? "bg-red-600 text-white"
                                : "bg-amber-500 text-white"
                            : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-50",
                        )}
                      >
                        {st === "PRESENT" ? "Present" : st === "ABSENT" ? "Absent" : "Leave"}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "exams" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="mb-4 text-base font-bold text-navy">Record Result</h2>
            <form onSubmit={saveExam} className="space-y-4">
              <FormField label="Student" hint="Type at least 2 characters, then pick.">
                <input
                  value={examQuery}
                  onChange={(e) => {
                    setExamQuery(e.target.value);
                    setExamStudentId("");
                  }}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                  placeholder="Search student…"
                />
                {examOptions.length > 0 && (
                  <ul className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white">
                    {examOptions.map((s) => (
                      <li key={s.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setExamStudentId(s.id);
                            setExamQuery(`${s.name} (${s.studentId ?? "no ID"})`);
                            setExamOptions([]);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50"
                        >
                          {s.name} · {s.studentId ?? "no ID"}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </FormField>
              <FormField label="Exam name">
                <input
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  required
                  minLength={2}
                  maxLength={150}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                  placeholder="e.g. Mid-Semester Examination — Sem 3"
                />
              </FormField>
              <FormField label="Subject">
                <input
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value)}
                  required
                  minLength={2}
                  maxLength={150}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                  placeholder="e.g. Data Structures"
                />
              </FormField>
              <div className="grid grid-cols-3 gap-3">
                <FormField label="Marks">
                  <input
                    type="number"
                    value={examMarks}
                    onChange={(e) => setExamMarks(e.target.value)}
                    required
                    min={0}
                    step="any"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </FormField>
                <FormField label="Max marks">
                  <input
                    type="number"
                    value={examMax}
                    onChange={(e) => setExamMax(e.target.value)}
                    required
                    min={1}
                    step="any"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                  />
                </FormField>
                <FormField label="Grade">
                  <input
                    value={examGrade}
                    onChange={(e) => setExamGrade(e.target.value)}
                    maxLength={10}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
                    placeholder="A+"
                  />
                </FormField>
              </div>
              <button
                type="submit"
                disabled={savingExam}
                className="w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60"
              >
                {savingExam ? "Saving…" : "Record Result"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-3">
            <h2 className="mb-4 text-base font-bold text-navy">Recent Results</h2>
            {examsLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : exams.length === 0 ? (
              <EmptyState title="No results" message="No exam results recorded yet." />
            ) : (
              <ul className="space-y-2">
                {exams.map((x) => (
                  <li
                    key={x.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-mist px-4 py-3"
                  >
                    <div className="text-sm">
                      <p className="font-semibold text-navy">
                        {x.student.name}
                        <span className="ml-2 font-normal text-slate-500">
                          {x.examName} · {x.subject}
                        </span>
                      </p>
                      <p className="mt-0.5 text-slate-600">
                        {x.marksObtained}/{x.maxMarks}
                        {x.grade && (
                          <span className="ml-2">
                            <Badge tone="purple">{x.grade}</Badge>
                          </span>
                        )}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteExam(x.id)}
                      className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete result for ${x.student.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <AcademicPage />
    </ToastProvider>
  );
}
