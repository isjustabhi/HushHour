"use client";

import { useEffect, useMemo, useState } from "react";

interface MatchingScreenProps {
  elapsedMs: number;
  onCancel: () => void;
  showSafetyGuide: boolean;
  onSafetyGuide: () => void;
}

const TIPS = [
  "Be kind. They're up late for a reason too.",
  "You don't have to fix anything. Just being here is enough.",
  "There's no right thing to say.",
];

export default function MatchingScreen({
  elapsedMs,
  onCancel,
  showSafetyGuide,
  onSafetyGuide,
}: MatchingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const seconds = Math.floor(elapsedMs / 1000);
  const subtitle = useMemo(() => {
    if (seconds >= 30) return "Still looking... most matches happen within a minute";
    return "Looking for someone on your campus...";
  }, [seconds]);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-6 py-16 flex items-center justify-center">
      <main className="w-full max-w-xl space-y-8 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-[var(--hush-accent)]/80 animate-pulse" />
        <div className="space-y-2">
          <h1 className="font-heading text-4xl">Finding someone...</h1>
          <p className="text-[var(--hush-muted)]">{subtitle}</p>
          <p className="text-xs text-[var(--hush-muted)]">Elapsed: {seconds}s</p>
        </div>

        <p className="text-sm text-[var(--hush-muted)]">{TIPS[tipIndex]}</p>

        {showSafetyGuide ? (
          <button
            type="button"
            onClick={onSafetyGuide}
            className="rounded-full border border-[var(--hush-accent)]/40 px-4 py-2 text-sm"
          >
            Want to talk to a Safety Guide instead?
          </button>
        ) : null}

        <div className="text-right">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-[var(--hush-muted)] underline underline-offset-4"
          >
            Never mind, take me back
          </button>
        </div>
      </main>
    </div>
  );
}
