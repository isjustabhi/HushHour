"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

interface ReportButtonProps {
  sessionId: string;
}

export default function ReportButton({ sessionId }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  const submit = async () => {
    if (reason.trim().length < 3) return;
    setStatus("saving");
    const response = await fetch("/api/report", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, reason }),
    });
    if (response.ok) {
      trackEvent("report_filed");
      setStatus("saved");
      setOpen(false);
      setReason("");
    } else {
      setStatus("idle");
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--hush-muted)]"
      >
        Report
      </button>
      {open ? (
        <div className="absolute right-0 top-8 z-20 w-72 rounded-xl border border-white/10 bg-[var(--hush-bg-elevated)] p-3">
          <p className="mb-2 text-xs text-[var(--hush-muted)]">What happened?</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="h-24 w-full rounded-md border border-white/10 bg-black/20 p-2 text-xs outline-none"
          />
          <button
            type="button"
            onClick={submit}
            disabled={status === "saving"}
            className="mt-2 w-full rounded-full px-3 py-2 text-xs font-medium"
            style={{ background: "var(--hush-accent)", color: "#111" }}
          >
            {status === "saving" ? "Sending..." : status === "saved" ? "Reported" : "Submit report"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
