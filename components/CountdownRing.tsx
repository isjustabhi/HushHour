"use client";

import { useMemo } from "react";

interface CountdownRingProps {
  elapsedSeconds: number;
  totalSeconds?: number;
}

export default function CountdownRing({
  elapsedSeconds,
  totalSeconds = 300,
}: CountdownRingProps) {
  const { progress, remaining } = useMemo(() => {
    const elapsed = Math.max(0, elapsedSeconds);
    const ratio = Math.min(elapsed / totalSeconds, 1);
    const remainingSeconds = Math.max(0, Math.ceil(totalSeconds - elapsedSeconds));
    return { progress: ratio, remaining: remainingSeconds };
  }, [elapsedSeconds, totalSeconds]);

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = progress * circumference;

  return (
    <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full bg-black/30 px-2 py-1 backdrop-blur">
      <svg width="28" height="28" viewBox="0 0 100 100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="var(--hush-accent)"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <span className="text-xs text-white tabular-nums">{remaining}s</span>
    </div>
  );
}
