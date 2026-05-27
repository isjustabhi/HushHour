"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ResourceCard from "@/components/ResourceCard";
import { trackEvent } from "@/lib/analytics";

interface AftercareFormProps {
  sessionId: string;
}

const FEELINGS = [
  { id: "rain", emoji: "🌧" },
  { id: "neutral", emoji: "😐" },
  { id: "partly_sunny", emoji: "🌤" },
  { id: "sunny", emoji: "☀" },
] as const;

export default function AftercareForm({ sessionId }: AftercareFormProps) {
  const router = useRouter();
  const [feeling, setFeeling] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveReflection = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/journal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          feeling: feeling ?? undefined,
        }),
      });
      if (response.ok) {
        setSaved(true);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="font-heading text-4xl">That&apos;s our five minutes.</h1>
        <p className="text-[var(--hush-muted)]">How are you feeling now?</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        {FEELINGS.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => {
              setFeeling(option.id);
              trackEvent("aftercare_emoji_selected", { emoji: option.id });
            }}
            className={`h-12 w-12 rounded-full border text-xl ${
              feeling === option.id
                ? "border-white/40 bg-white/10"
                : "border-white/10"
            }`}
          >
            {option.emoji}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        <ResourceCard
          title="Call 988"
          subtitle="Suicide & Crisis Lifeline"
          href="tel:988"
        />
        <ResourceCard
          title="Text HOME to 741741"
          subtitle="Crisis Text Line"
          href="sms:741741?body=HOME"
        />
        <ResourceCard
          title="Campus counseling resources"
          subtitle="See support options near you"
          href="/crisis"
        />
        <ResourceCard
          title="Journaling prompt"
          subtitle="Spend 2 minutes with your thoughts"
          href="/journal"
        />
      </div>

      <div className="grid gap-2">
        <div className="rounded-xl border border-white/10 bg-[var(--hush-bg-elevated)] px-4 py-3 text-left">
          <p className="text-sm font-medium">Need to borrow something for class?</p>
          <p className="text-xs text-[var(--hush-muted)] mt-1">
            Check out RentIts for local campus sharing.
          </p>
          <a
            className="mt-2 inline-block text-xs underline underline-offset-4"
            href="https://rentits.example.com"
            target="_blank"
            rel="noreferrer"
          >
            Open RentIts
          </a>
        </div>
        <button
          type="button"
          onClick={() => router.push("/lobby?role=listener")}
          className="h-11 rounded-full border border-white/10 bg-white/5 px-4 text-sm"
        >
          Want to be a listener next time?
        </button>
        <button
          type="button"
          onClick={saveReflection}
          disabled={saving || saved}
          className="h-11 rounded-full px-4 text-sm font-medium disabled:opacity-60"
          style={{ background: "var(--hush-accent)", color: "#111" }}
        >
          {saved ? "Saved to journal" : saving ? "Saving..." : "Save a private reflection"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="h-11 rounded-full border border-white/10 bg-transparent px-4 text-sm"
        >
          Take me home
        </button>
      </div>
    </div>
  );
}
