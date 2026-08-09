import React from "react";
import { LoaderCircle } from "lucide-react";

export default function PageLoader({ label = "Loading your space…" }) {
  return (
    <div className="min-h-[55vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-textMuted">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl border border-border bg-surface flex items-center justify-center">
            <LoaderCircle size={21} className="text-cream animate-spin" />
          </div>
          <span className="absolute -right-1 -top-1 w-2.5 h-2.5 rounded-full bg-teal animate-pulse" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-textSecondary">{label}</p>
          <p className="text-[11px] mt-1">Just a moment…</p>
        </div>
      </div>
    </div>
  );
}
