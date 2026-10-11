"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, LifeBuoy, Mail, Send } from "lucide-react";
import Badge from "@/components/Badge";
import FormField from "@/components/FormField";
import EmptyState from "@/components/EmptyState";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ToastProvider, useToast } from "@/components/Toast";
import { cn, formatDateTime } from "@/lib/utils";

const FAQS = [
  {
    q: "How do I update my personal details?",
    a: "Go to My Profile and click the Edit button. You can update your phone number, date of birth, gender, address, and guardian details. Your email, student ID and role are managed by the college and cannot be changed from here.",
  },
  {
    q: "How do I mark a task as done?",
    a: "Open My Tasks, find the task, and use the status controls on the task card to move it from Pending to In Progress, and then to Completed when you finish it. Your dashboard will reflect the change immediately.",
  },
  {
    q: "I forgot my password. What should I do?",
    a: "If you are signed in, use the Change Password page in the sidebar. If you cannot sign in at all, contact the college administration office — they can reset your account for you.",
  },
  {
    q: "Where can I see my academic and fee records?",
    a: "The My Records page lists all official entries the college has added for you — academic, attendance, fee and disciplinary records — grouped by type. If something looks wrong, raise a support request below.",
  },
  {
    q: "How do I contact the college for help?",
    a: "Use the support request form on this page. Describe your issue clearly and it will be sent to the administration team. You can also visit the college administration office in person during working hours.",
  },
];

interface SupportRequest {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

function statusTone(status: string): "gold" | "blue" | "green" | "red" {
  const s = status.toUpperCase();
  if (s.includes("RESOLV") || s === "CLOSED" || s === "DONE") return "green";
  if (s.includes("PROGRESS") || s === "OPEN") return "blue";
  if (s.includes("REJECT")) return "red";
  return "gold";
}

function HelpContent() {
  const { toast } = useToast();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const res = await fetch("/api/support-requests");
      if (res.ok) {
        const json = await res.json();
        setRequests(json.data ?? []);
      }
    } catch {
      // list is secondary; the form is the important part
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setFormError("Please fill in both the subject and your message.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const res = await fetch("/api/support-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          message: message.trim(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || json?.error || "Failed to send request");
      }
      setSubject("");
      setMessage("");
      toast("Support request sent", "success");
      loadRequests();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to send request"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">Help &amp; Support</h1>
        <p className="mt-1 text-sm text-slate-500">
          Answers to common questions, and a way to reach the administration
          team.
        </p>
      </div>

      {/* FAQ accordion */}
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-navy">
          <LifeBuoy className="h-5 w-5 text-brand" /> Frequently Asked Questions
        </h2>
        <div className="divide-y divide-slate-100">
          {FAQS.map((faq, i) => {
            const open = openIndex === i;
            return (
              <div key={i}>
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-4 text-left"
                  aria-expanded={open}
                >
                  <span className="text-sm font-semibold text-navy">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-slate-400 transition-transform",
                      open && "rotate-180"
                    )}
                  />
                </button>
                {open && (
                  <p className="pb-4 pr-8 text-sm leading-relaxed text-slate-600">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact card */}
      <section className="rounded-2xl bg-navy p-5 text-white shadow-sm sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-bold">
          <Mail className="h-5 w-5" /> Contact the College
        </h2>
        <p className="mt-2 text-sm text-white/80">
          For admissions, fees, certificates, or anything urgent, contact the
          college administration office directly. You can also send a support
          request using the form below and the team will respond here.
        </p>
        <p className="mt-3 text-sm font-semibold">
          Ambalika Institute of Management and Technology, Lucknow, Uttar
          Pradesh
        </p>
      </section>

      {/* Support request form */}
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-bold text-navy">
          Raise a Support Request
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Subject">
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of your issue"
              maxLength={120}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </FormField>
          <FormField label="Message" hint="Describe the issue in detail so the team can help you faster.">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="What do you need help with?"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </FormField>
          {formError && (
            <p className="rounded-xl bg-college/10 px-3 py-2 text-sm font-medium text-college">
              {formError}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
          >
            <Send className="h-4 w-4" />
            {submitting ? "Sending..." : "Send request"}
          </button>
        </form>
      </section>

      {/* Own requests */}
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-bold text-navy">My Requests</h2>
        {loadingRequests ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner label="Loading your requests" />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={LifeBuoy}
            title="No requests yet"
            message="You have not raised any support requests so far."
          />
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <article
                key={r.id}
                className="rounded-xl border border-slate-100 bg-mist/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-navy">{r.subject}</h3>
                    <p className="mt-1 text-sm text-slate-600">{r.message}</p>
                  </div>
                  <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {formatDateTime(r.createdAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function StudentHelpPage() {
  return (
    <ToastProvider>
      <HelpContent />
    </ToastProvider>
  );
}
