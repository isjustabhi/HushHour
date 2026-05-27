"use client";

interface PulsePoint {
  tag: string;
  count: number;
}

interface PulseDashboardProps {
  conversationsToday: number;
  topThemes: string[];
  vibeCounts: PulsePoint[];
}

export default function PulseDashboard({
  conversationsToday,
  topThemes,
  vibeCounts,
}: PulseDashboardProps) {
  const max = Math.max(1, ...vibeCounts.map((v) => v.count));

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-[var(--hush-bg-elevated)] p-5">
        <p className="text-sm text-[var(--hush-muted)]">
          Conversations on your campus tonight
        </p>
        <p className="mt-2 text-4xl font-heading">{conversationsToday}</p>
        <p className="mt-2 text-sm text-[var(--hush-muted)]">
          Top themes: {topThemes.length ? topThemes.join(", ") : "still emerging"}
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[var(--hush-bg-elevated)] p-5">
        <p className="mb-4 text-sm text-[var(--hush-muted)]">Theme distribution</p>
        <div className="space-y-3">
          {vibeCounts.map((point) => (
            <div key={point.tag} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>{point.tag}</span>
                <span>{point.count}</span>
              </div>
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full"
                  style={{
                    width: `${Math.round((point.count / max) * 100)}%`,
                    background: "var(--hush-accent)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[var(--hush-muted)]">
          These numbers update every 5 minutes. No individual conversation is ever visible.
        </p>
      </div>
    </div>
  );
}
