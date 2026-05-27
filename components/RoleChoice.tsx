"use client";

type Role = "seeker" | "listener";

interface RoleChoiceProps {
  value: Role;
  onChange: (value: Role) => void;
}

export default function RoleChoice({ value, onChange }: RoleChoiceProps) {
  return (
    <div className="flex items-center justify-center gap-3 text-sm">
      <button
        type="button"
        onClick={() => onChange("listener")}
        className={`rounded-full border px-4 py-2 transition ${
          value === "listener"
            ? "border-white/30 bg-white/10 text-white"
            : "border-white/10 text-[var(--hush-muted)]"
        }`}
      >
        I want to listen
      </button>
      <button
        type="button"
        onClick={() => onChange("seeker")}
        className={`rounded-full border px-4 py-2 transition ${
          value === "seeker"
            ? "border-white/30 bg-white/10 text-white"
            : "border-white/10 text-[var(--hush-muted)]"
        }`}
      >
        I want to talk
      </button>
    </div>
  );
}
