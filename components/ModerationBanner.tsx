"use client";

import { useMemo } from "react";
import type { ModerationResult } from "@/lib/schemas";

interface ModerationBannerProps {
  moderation: ModerationResult | null;
}

export default function ModerationBanner({ moderation }: ModerationBannerProps) {
  const tone = useMemo(() => {
    if (!moderation) return "var(--hush-bg-elevated)";
    if (moderation.classification === "CRISIS") return "var(--hush-crisis)";
    if (moderation.classification === "PII") return "var(--hush-warn)";
    return "var(--hush-bg-elevated)";
  }, [moderation]);

  if (!moderation || moderation.action === "ALLOW") {
    return null;
  }

  return (
    <div
      className="rounded-lg px-4 py-3 text-sm border border-white/10"
      style={{ backgroundColor: tone, color: "#111" }}
    >
      <p>{moderation.reason_for_user}</p>
      {moderation.classification === "CRISIS" ? (
        <p className="mt-1 text-xs">988 • Text HOME to 741741 • Trevor Project</p>
      ) : null}
    </div>
  );
}
