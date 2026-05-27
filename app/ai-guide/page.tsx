"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type GuideMessage = {
  role: "user" | "assistant";
  content: string;
};

const STATIC_RESOURCES = [
  { label: "Call 988", href: "tel:988" },
  { label: "Text HOME to 741741", href: "sms:741741?body=HOME" },
  { label: "Trevor Project", href: "tel:+1-866-488-7386" },
  { label: "Open Crisis Resources", href: "/crisis" },
];

export default function AIGuidePage() {
  const [messages, setMessages] = useState<GuideMessage[]>([
    {
      role: "assistant",
      content:
        "I’m here with you. You don’t have to handle this alone. Want to tell me what feels heaviest right now?",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);

  const canSend = useMemo(
    () => input.trim().length > 0 && !streaming,
    [input, streaming],
  );

  const onSend = async () => {
    if (!canSend) return;
    const userText = input.trim();
    setInput("");
    setStreaming(true);

    const nextMessages: GuideMessage[] = [...messages, { role: "user", content: userText }];
    setMessages(nextMessages);

    try {
      const response = await fetch("/api/crisis/ai-guide", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok || !response.body) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "I’m still here. If you’re in immediate danger, please call 988 now.",
          },
        ]);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: "assistant", content: assistantText };
          return copy;
        });
      }
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <main className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[1fr_320px]">
        <section className="rounded-2xl border border-white/10 bg-[var(--hush-bg-elevated)] p-4">
          <h1 className="font-heading text-3xl mb-2">Safety Guide</h1>
          <p className="text-sm text-[var(--hush-muted)] mb-4">
            I can listen and help you get to human support quickly.
          </p>

          <div className="h-[60vh] overflow-y-auto space-y-3 pr-1">
            {messages.map((message, idx) => (
              <div
                key={idx}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-[80%] rounded-2xl px-4 py-2 text-sm"
                  style={{
                    background:
                      message.role === "user" ? "var(--hush-you)" : "rgba(255,255,255,0.08)",
                    color: message.role === "user" ? "#111" : "var(--foreground)",
                  }}
                >
                  {message.content || (streaming ? "..." : "")}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what’s going on..."
              className="h-11 flex-1 rounded-full border border-white/10 bg-black/20 px-4 text-sm outline-none"
            />
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              className="h-11 rounded-full px-5 text-sm font-medium disabled:opacity-50"
              style={{ background: "var(--hush-accent)", color: "#111" }}
            >
              {streaming ? "..." : "Send"}
            </button>
          </div>
        </section>

        <aside className="space-y-3">
          <div className="rounded-2xl border border-[var(--hush-crisis)]/50 bg-[var(--hush-bg-elevated)] p-4">
            <h2 className="font-medium">Immediate support</h2>
            <p className="mt-1 text-sm text-[var(--hush-muted)]">
              If you might act on thoughts of self-harm, call 988 now.
            </p>
          </div>

          {STATIC_RESOURCES.map((resource) => (
            <Link
              key={resource.label}
              href={resource.href}
              className="block rounded-xl border border-white/10 bg-[var(--hush-bg-elevated)] p-4 text-sm"
            >
              {resource.label}
            </Link>
          ))}
        </aside>
      </main>
    </div>
  );
}
