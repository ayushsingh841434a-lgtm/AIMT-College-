import { Loader2 } from "lucide-react";

type LoadingSpinnerProps = {
  label?: string;
};

export default function LoadingSpinner({ label = "Loading…" }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12">
      <Loader2 className="h-8 w-8 animate-spin text-brand" aria-hidden="true" />
      <p className="text-sm font-medium text-slate-500" role="status">
        {label}
      </p>
    </div>
  );
}
