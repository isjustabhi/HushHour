"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ModerationResult } from "@/lib/schemas";
import CountdownRing from "@/components/CountdownRing";
import ExtendPrompt from "@/components/ExtendPrompt";
import MessageBubble from "@/components/MessageBubble";
import ModerationBanner from "@/components/ModerationBanner";
import ReportButton from "@/components/ReportButton";
import { trackEvent } from "@/lib/analytics";
import { getRealtimeClient } from "@/lib/realtime";

interface ChatMessage {
  id: string;
  sender_id: string;
  body: string;
}

interface ChatRoomProps {
  sessionId: string;
  currentUserId: string;
  startedAtIso: string;
  initialExtendedCount?: number;
  initialMessages: ChatMessage[];
}

export default function ChatRoom({
  sessionId,
  currentUserId,
  startedAtIso,
  initialExtendedCount = 0,
  initialMessages,
}: ChatRoomProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [moderation, setModeration] = useState<ModerationResult | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [extendedCount, setExtendedCount] = useState(initialExtendedCount);
  const [waitingForOther, setWaitingForOther] = useState(false);
  const [votedThisWindow, setVotedThisWindow] = useState(false);
  const endedTrackedRef = useRef(false);

  useEffect(() => {
    const startedAt = new Date(startedAtIso).getTime();
    const id = window.setInterval(() => {
      const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000));
      setElapsedSeconds(seconds);
    }, 1000);
    return () => window.clearInterval(id);
  }, [startedAtIso]);

  useEffect(() => {
    const client = getRealtimeClient();
    const channel = client
      .channel(`messages-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          setMessages((prev) => {
            if (prev.some((m) => m.id === row.id)) return prev;
            return [...prev, row];
          });
        },
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [sessionId]);

  const totalSeconds = 300 + extendedCount * 300;
  const remaining = useMemo(
    () => Math.max(0, totalSeconds - elapsedSeconds),
    [elapsedSeconds, totalSeconds],
  );

  const extendOpen = useMemo(() => {
    const currentWindowEnd = 300 + extendedCount * 300;
    const currentWindowPromptAt = currentWindowEnd - 30;
    return (
      elapsedSeconds >= currentWindowPromptAt &&
      elapsedSeconds < currentWindowEnd &&
      extendedCount < 2 &&
      !votedThisWindow
    );
  }, [elapsedSeconds, extendedCount, votedThisWindow]);

  useEffect(() => {
    if (remaining <= 0 && !endedTrackedRef.current) {
      endedTrackedRef.current = true;
      trackEvent("session_ended", { reason: "completed" });
      router.replace(`/aftercare/${sessionId}`);
    }
  }, [remaining, router, sessionId]);

  const onSend = async () => {
    const body = input.trim();
    if (!body || sending) return;

    setSending(true);
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, message_body: body }),
      });
      const data = await response.json();

      if (!response.ok) {
        return;
      }

      if (data.moderation) {
        setModeration(data.moderation);
        trackEvent("message_moderation_event", {
          class: data.moderation.classification,
        });
      }

      if (data.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.message.id)) return prev;
          return [...prev, data.message];
        });
      }

      if (data.crisis_routed) {
        trackEvent("session_ended", { reason: "crisis_routed" });
        router.replace("/crisis");
        return;
      }

      setInput("");
    } finally {
      setSending(false);
    }
  };

  const onVoteExtend = async (vote: boolean) => {
    if (votedThisWindow) return;
    setVotedThisWindow(true);
    setWaitingForOther(vote);
    if (!vote) {
      return;
    }
    const response = await fetch("/api/extend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ session_id: sessionId, vote }),
    });
    const data = await response.json();
    if (data.extended) {
      setExtendedCount(data.extended_count);
      setWaitingForOther(false);
      setVotedThisWindow(false);
    } else if (data.waiting_for_other) {
      setWaitingForOther(true);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <CountdownRing elapsedSeconds={elapsedSeconds} />

      <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-4 py-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <ModerationBanner moderation={moderation} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                trackEvent("session_ended", { reason: "left_user" });
                router.push(`/aftercare/${sessionId}`);
              }}
              className="rounded-full border border-white/10 px-3 py-1 text-xs text-[var(--hush-muted)]"
            >
              End conversation
            </button>
            <ReportButton sessionId={sessionId} />
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-white/10 bg-[var(--hush-bg-elevated)] p-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              body={message.body}
              isMine={message.sender_id === currentUserId}
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Say what you need to say..."
            className="h-11 flex-1 rounded-full border border-white/10 bg-black/20 px-4 text-sm outline-none"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={sending || input.trim().length === 0}
            className="h-11 rounded-full px-5 text-sm font-medium disabled:opacity-50"
            style={{ background: "var(--hush-accent)", color: "#111" }}
          >
            {sending ? "..." : "Send"}
          </button>
        </div>
        <ExtendPrompt
          open={extendOpen}
          waitingForOther={waitingForOther}
          onVote={onVoteExtend}
        />
      </main>
    </div>
  );
}
