import type { ReactNode } from "react";

type FormFieldProps = {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
};

export default function FormField({
  label,
  error,
  hint,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={className}>
      <label className="block text-sm font-medium text-slate-700">
        <span>{label}</span>
        <span className="mt-1 block">{children}</span>
      </label>
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
