"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen, RefreshCw } from "lucide-react";
import Badge from "@/components/Badge";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatDate } from "@/lib/utils";

interface ApiRecord {
  id: string;
  type: string;
  title: string;
  details: unknown;
  createdAt: string;
  author?: { name: string };
}

const TYPE_ORDER = ["ACADEMIC", "ATTENDANCE", "FEE", "DISCIPLINARY", "OTHER"];

const TYPE_TONE: Record<string, "blue" | "green" | "gold" | "red" | "purple"> =
  {
    ACADEMIC: "blue",
    ATTENDANCE: "green",
    FEE: "gold",
    DISCIPLINARY: "red",
    OTHER: "purple",
  };

function prettyLabel(key: string): string {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function DetailsList({ details }: { details: unknown }) {
  if (details === null || details === undefined || details === "") {
    return <p className="text-sm text-slate-400">No additional details.</p>;
  }
  if (typeof details === "string") {
    return <p className="text-sm text-slate-600">{details}</p>;
  }
  if (typeof details === "object" && !Array.isArray(details)) {
    const entries = Object.entries(details as Record<string, unknown>);
    if (entries.length === 0) {
      return <p className="text-sm text-slate-400">No additional details.</p>;
    }
    return (
      <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {entries.map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {prettyLabel(key)}
            </dt>
            <dd className="mt-0.5 text-sm text-slate-700">
              {value === null || value === undefined
                ? "—"
                : typeof value === "object"
                  ? JSON.stringify(value)
                  : String(value)}
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  if (Array.isArray(details)) {
    return (
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
        {details.map((item, i) => (
          <li key={i}>
            {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </li>
        ))}
      </ul>
    );
  }
  return <p className="text-sm text-slate-600">{String(details)}</p>;
}

function RecordsContent() {
  const [records, setRecords] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/records");
      if (!res.ok) throw new Error();
      const json = await res.json();
      setRecords(json.data ?? []);
    } catch {
      setError("We could not load your records. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading records" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-navy">{error}</p>
        <button
          onClick={load}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }

  const grouped = new Map<string, ApiRecord[]>();
  for (const r of records) {
    const type = r.type || "OTHER";
    if (!grouped.has(type)) grouped.set(type, []);
    grouped.get(type)!.push(r);
  }
  const orderedTypes = [
    ...TYPE_ORDER.filter((t) => grouped.has(t)),
    ...[...grouped.keys()].filter((t) => !TYPE_ORDER.includes(t)),
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">My Records</h1>
        <p className="mt-1 text-sm text-slate-500">
          Official records maintained by the college — academic, attendance, fee
          and disciplinary entries.
        </p>
      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <EmptyState
            icon={FolderOpen}
            title="No records"
            message="The college has not added any records for you yet."
          />
        </div>
      ) : (
        orderedTypes.map((type) => (
          <section
            key={type}
            className="rounded-2xl bg-white p-5 shadow-sm sm:p-6"
          >
            <div className="mb-4 flex items-center gap-3">
              <Badge tone={TYPE_TONE[type] ?? "blue"}>
                {prettyLabel(type)}
              </Badge>
              <span className="text-sm text-slate-500">
                {grouped.get(type)!.length}{" "}
                {grouped.get(type)!.length === 1 ? "entry" : "entries"}
              </span>
            </div>
            <div className="space-y-4">
              {grouped.get(type)!.map((r) => (
                <article
                  key={r.id}
                  className="rounded-xl border border-slate-100 bg-mist/60 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-navy">{r.title}</h3>
                    <span className="text-xs text-slate-500">
                      {formatDate(r.createdAt)}
                      {r.author?.name ? ` · ${r.author.name}` : ""}
                    </span>
                  </div>
                  <div className="mt-3">
                    <DetailsList details={r.details} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

export default function StudentRecordsPage() {
  return <RecordsContent />;
}
