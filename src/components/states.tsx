import { AlertTriangle, Inbox, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function LoadingState({ label = "Wird geladen …" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 p-6 text-white/65">
      <Loader2 className="animate-spin" size={18} aria-hidden /> {label}
    </div>
  );
}

export function ErrorState({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-ember/30 bg-ember/15 p-4 text-sm text-red-100">
      <AlertTriangle className="mt-0.5 shrink-0" size={16} aria-hidden />
      <div>{children}</div>
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-6 text-center">
      <Inbox className="mx-auto mb-2 text-white/40" size={22} aria-hidden />
      <p className="font-black">{title}</p>
      {children && <p className="mt-1 text-sm text-white/60">{children}</p>}
    </div>
  );
}
