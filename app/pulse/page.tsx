"use client";

import { useEffect, useState } from "react";
import PulseDashboard from "@/components/PulseDashboard";

interface PulsePayload {
  conversations_today: number;
  top_themes: string[];
  vibe_counts: Array<{ tag: string; count: number }>;
}

export default function PulsePage() {
  const [data, setData] = useState<PulsePayload | null>(null);

  useEffect(() => {
    const run = async () => {
      const response = await fetch("/api/pulse");
      if (!response.ok) return;
      const payload = (await response.json()) as PulsePayload;
      setData(payload);
    };
    void run();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-5 py-10">
      <main className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="font-heading text-4xl">Campus Pulse</h1>
          <p className="text-[var(--hush-muted)]">
            Anonymous aggregate only. Never personal, never identifiable.
          </p>
        </header>
        {data ? (
          <PulseDashboard
            conversationsToday={data.conversations_today}
            topThemes={data.top_themes}
            vibeCounts={data.vibe_counts}
          />
        ) : (
          <p className="text-sm text-[var(--hush-muted)]">Loading pulse...</p>
        )}
      </main>
    </div>
  );
}
