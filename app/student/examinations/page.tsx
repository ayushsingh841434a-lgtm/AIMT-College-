"use client";

import { useCallback, useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import Badge from "@/components/Badge";
import { GraduationCap } from "lucide-react";
import { ToastProvider, useToast } from "@/components/Toast";

type Exam = {
  id: string;
  examName: string;
  subject: string;
  marksObtained: number;
  maxMarks: number;
  grade: string | null;
  createdAt: string;
};

type ExamGroup = {
  examName: string;
  subjects: Exam[];
  obtained: number;
  max: number;
  percentage: number;
};

function ExaminationsPage() {
  const { toast } = useToast();
  const [groups, setGroups] = useState<ExamGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/exams?pageSize=100", { credentials: "same-origin" });
      if (!res.ok) throw new Error("Could not load exam results.");
      const body = await res.json();
      const exams: Exam[] = body.data ?? [];
      const map = new Map<string, Exam[]>();
      for (const e of exams) {
        const list = map.get(e.examName) ?? [];
        list.push(e);
        map.set(e.examName, list);
      }
      const grouped: ExamGroup[] = [...map.entries()].map(([examName, subjects]) => {
        const obtained = subjects.reduce((s, x) => s + x.marksObtained, 0);
        const max = subjects.reduce((s, x) => s + x.maxMarks, 0);
        return {
          examName,
          subjects,
          obtained,
          max,
          percentage: max === 0 ? 0 : Math.round((obtained / max) * 1000) / 10,
        };
      });
      setGroups(grouped);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not load exam results.", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <EmptyState title="No results" message="No examination results published yet." />
        </div>
      ) : (
        groups.map((g) => (
          <section
            key={g.examName}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-navy">
                <GraduationCap className="h-5 w-5 text-brand" />
                {g.examName}
              </h2>
              <p className="text-sm text-slate-500">
                Total: <span className="font-bold text-navy">{g.obtained}/{g.max}</span>{" "}
                <Badge tone={g.percentage >= 60 ? "green" : g.percentage >= 40 ? "gold" : "red"}>
                  {g.percentage}%
                </Badge>
              </p>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-mist text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-2.5 font-semibold">Subject</th>
                    <th className="px-4 py-2.5 font-semibold">Marks</th>
                    <th className="px-4 py-2.5 font-semibold">Grade</th>
                    <th className="px-4 py-2.5 font-semibold">%</th>
                  </tr>
                </thead>
                <tbody>
                  {g.subjects.map((s) => {
                    const pct = s.maxMarks === 0 ? 0 : Math.round((s.marksObtained / s.maxMarks) * 1000) / 10;
                    return (
                      <tr key={s.id} className="border-t border-slate-100">
                        <td className="px-4 py-2.5 font-medium text-navy">{s.subject}</td>
                        <td className="px-4 py-2.5 text-slate-700">
                          {s.marksObtained}/{s.maxMarks}
                        </td>
                        <td className="px-4 py-2.5">
                          {s.grade ? <Badge tone="purple">{s.grade}</Badge> : "—"}
                        </td>
                        <td className="px-4 py-2.5 text-slate-700">{pct}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
      <p className="text-xs text-slate-400">
        Results are published by the college management. For re-evaluation queries, use the Help
        & Support page.
      </p>
    </div>
  );
}

export default function Page() {
  return (
    <ToastProvider>
      <ExaminationsPage />
    </ToastProvider>
  );
}
