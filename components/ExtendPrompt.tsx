"use client";

interface ExtendPromptProps {
  open: boolean;
  waitingForOther: boolean;
  onVote: (vote: boolean) => void;
}

export default function ExtendPrompt({
  open,
  waitingForOther,
  onVote,
}: ExtendPromptProps) {
  if (!open) return null;

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-[var(--hush-bg-elevated)] px-4 py-3">
      <p className="text-sm">5 more minutes?</p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => onVote(true)}
          className="rounded-full px-4 py-2 text-xs font-medium"
          style={{ background: "var(--hush-accent)", color: "#111" }}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onVote(false)}
          className="rounded-full border border-white/10 px-4 py-2 text-xs"
        >
          No
        </button>
      </div>
      {waitingForOther ? (
        <p className="mt-2 text-xs text-[var(--hush-muted)]">
          They&apos;re up for 5 more minutes. You?
        </p>
      ) : null}
    </div>
  );
}
