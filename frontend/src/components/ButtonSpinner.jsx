import React from "react";
import { LoaderCircle } from "lucide-react";

export default function ButtonSpinner({ label = "Saving…" }) {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <LoaderCircle size={14} className="animate-spin" />
      {label}
    </span>
  );
}
