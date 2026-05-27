"use client";

const VIBE_TAGS = [
  "school",
  "loneliness",
  "family",
  "anxiety",
  "just sad",
  "just want to talk",
] as const;

interface VibeTagPickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export default function VibeTagPicker({ value, onChange }: VibeTagPickerProps) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {VIBE_TAGS.map((tag) => {
        const active = value === tag;
        return (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(active ? null : tag)}
            className={`rounded-full border px-3 py-1 text-xs transition ${
              active
                ? "border-white/30 bg-white/10 text-white"
                : "border-white/10 text-[var(--hush-muted)]"
            }`}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
