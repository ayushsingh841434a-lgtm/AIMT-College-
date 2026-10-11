"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, RefreshCw, User } from "lucide-react";
import Modal from "@/components/Modal";
import FormField from "@/components/FormField";
import LoadingSpinner from "@/components/LoadingSpinner";
import { ToastProvider, useToast } from "@/components/Toast";
import { formatDate } from "@/lib/utils";

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    studentId: string;
    status: string;
  };
  profile: {
    phone: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    address: string | null;
    course: string | null;
    branch: string | null;
    year: number | null;
    semester: number | null;
    admissionYear: number | null;
    guardianName: string | null;
    guardianPhone: string | null;
  } | null;
}

const GENDER_OPTIONS = ["", "Male", "Female", "Other"];

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-navy">
        {value === null || value === undefined || value === "" ? (
          <span className="font-normal text-slate-400">Not provided</span>
        ) : (
          String(value)
        )}
      </dd>
    </div>
  );
}

function ProfileContent() {
  const { toast } = useToast();
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    guardianName: "",
    guardianPhone: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error();
      const json: ProfileData = await res.json();
      setData(json);
    } catch {
      setError("We could not load your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = () => {
    const p = data?.profile;
    setForm({
      phone: p?.phone ?? "",
      dateOfBirth: p?.dateOfBirth ? p.dateOfBirth.slice(0, 10) : "",
      gender: p?.gender ?? "",
      address: p?.address ?? "",
      guardianName: p?.guardianName ?? "",
      guardianPhone: p?.guardianPhone ?? "",
    });
    setFormError(null);
    setEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: form.phone.trim() || null,
          dateOfBirth: form.dateOfBirth || null,
          gender: form.gender || null,
          address: form.address.trim() || null,
          guardianName: form.guardianName.trim() || null,
          guardianPhone: form.guardianPhone.trim() || null,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(json?.message || json?.error || "Failed to update profile");
      }
      setEditOpen(false);
      toast("Profile updated successfully", "success");
      load();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading your profile" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-medium text-navy">
          {error ?? "Profile not found."}
        </p>
        <button
          onClick={load}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
        >
          <RefreshCw className="h-4 w-4" /> Try again
        </button>
      </div>
    );
  }

  const { user, profile } = data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy">My Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Your personal and academic details as recorded by the college.
        </p>
      </div>

      {/* Identity card */}
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10">
              <User className="h-7 w-7 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-navy">{user.name}</h2>
              <p className="text-sm text-slate-500">{user.email}</p>
              <p className="mt-1 font-mono text-xs text-slate-500">
                Student ID: {user.studentId}
              </p>
            </div>
          </div>
          <button
            onClick={openEdit}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-navy transition hover:border-brand hover:text-brand"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
      </section>

      {/* Academic details */}
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-bold text-navy">Academic Details</h2>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Course" value={profile?.course} />
          <Field label="Branch" value={profile?.branch} />
          <Field label="Year" value={profile?.year} />
          <Field label="Semester" value={profile?.semester} />
          <Field label="Admission Year" value={profile?.admissionYear} />
          <Field label="Status" value={user.status} />
        </dl>
      </section>

      {/* Personal details */}
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-bold text-navy">Personal Details</h2>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Phone" value={profile?.phone} />
          <Field
            label="Date of Birth"
            value={profile?.dateOfBirth ? formatDate(profile.dateOfBirth) : null}
          />
          <Field label="Gender" value={profile?.gender} />
          <div className="sm:col-span-2">
            <Field label="Address" value={profile?.address} />
          </div>
        </dl>
      </section>

      {/* Guardian details */}
      <section className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h2 className="mb-4 text-base font-bold text-navy">Guardian Details</h2>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Guardian Name" value={profile?.guardianName} />
          <Field label="Guardian Phone" value={profile?.guardianPhone} />
        </dl>
      </section>

      <p className="rounded-2xl bg-mist p-4 text-sm text-slate-500">
        Email, student ID and role cannot be changed here. If any of these are
        incorrect, please contact the college administration office.
      </p>

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="e.g. 9876543210"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </FormField>
            <FormField label="Date of Birth">
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={set("dateOfBirth")}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </FormField>
          </div>
          <FormField label="Gender">
            <select
              value={form.gender}
              onChange={set("gender")}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            >
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g === "" ? "Select" : g}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Address">
            <textarea
              value={form.address}
              onChange={set("address")}
              rows={3}
              placeholder="Your current residential address"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Guardian Name">
              <input
                type="text"
                value={form.guardianName}
                onChange={set("guardianName")}
                placeholder="Guardian full name"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </FormField>
            <FormField label="Guardian Phone">
              <input
                type="tel"
                value={form.guardianPhone}
                onChange={set("guardianPhone")}
                placeholder="e.g. 9876543210"
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-navy outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </FormField>
          </div>
          {formError && (
            <p className="rounded-xl bg-college/10 px-3 py-2 text-sm font-medium text-college">
              {formError}
            </p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-mist"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function StudentProfilePage() {
  return (
    <ToastProvider>
      <ProfileContent />
    </ToastProvider>
  );
}
