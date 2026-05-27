"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MatchingScreen from "@/components/MatchingScreen";
import { trackEvent } from "@/lib/analytics";
import { getRealtimeClient } from "@/lib/realtime";

type Role = "seeker" | "listener";

export default function MatchingPage() {
  const router = useRouter();
  const params = useSearchParams();
  const role = (params.get("role") ?? "seeker") as Role;
  const vibeTag = params.get("vibe");

  const [queueId, setQueueId] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startRequestedRef = useRef(false);
  const trackedMatchRef = useRef(false);
  const elapsedMsRef = useRef(0);
  const pollRef = useRef<number | null>(null);

  const elapsedMs = elapsedSeconds * 1000;
  const showSafetyGuide = useMemo(
    () => role === "seeker" && elapsedMs >= 90_000,
    [elapsedMs, role],
  );

  useEffect(() => {
    elapsedMsRef.current = elapsedSeconds * 1000;
  }, [elapsedSeconds]);

  useEffect(() => {
    const tick = window.setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    if (startRequestedRef.current) return;
    startRequestedRef.current = true;

    const startMatching = async () => {
      const response = await fetch("/api/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          role,
          vibe_tag: vibeTag ?? null,
        }),
      });

      const data = await response.json();
      if (data.session_id) {
        if (!trackedMatchRef.current) {
          trackedMatchRef.current = true;
          trackEvent("match_found", { wait_time_ms: elapsedMsRef.current });
        }
        router.replace(`/chat/${data.session_id}`);
        return;
      }
      if (data.waiting && data.queue_id) {
        setQueueId(data.queue_id);
      }
    };

    void startMatching();
  }, [role, router, vibeTag]);

  useEffect(() => {
    if (!queueId) return;

    const client = getRealtimeClient();
    const channel = client
      .channel(`queue-delete-${queueId}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "matching_queue",
          filter: `id=eq.${queueId}`,
        },
        async () => {
          const response = await fetch("/api/match");
          const data = await response.json();
          if (data.session_id) {
            if (!trackedMatchRef.current) {
              trackedMatchRef.current = true;
              trackEvent("match_found", { wait_time_ms: elapsedMsRef.current });
            }
            router.replace(`/chat/${data.session_id}`);
          }
        },
      )
      .subscribe();

    pollRef.current = window.setInterval(async () => {
      const response = await fetch("/api/match");
      const data = await response.json();
      if (data.session_id) {
        if (!trackedMatchRef.current) {
          trackedMatchRef.current = true;
          trackEvent("match_found", { wait_time_ms: elapsedMsRef.current });
        }
        router.replace(`/chat/${data.session_id}`);
      }
    }, 2000);

    return () => {
      client.removeChannel(channel);
      if (pollRef.current) {
        window.clearInterval(pollRef.current);
      }
    };
  }, [queueId, router]);

  const onCancel = async () => {
    if (queueId) {
      await fetch("/api/queue/cancel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ queue_id: queueId }),
      }).catch(() => null);
    }
    router.replace("/");
  };

  return (
    <MatchingScreen
      elapsedMs={elapsedMs}
      onCancel={onCancel}
      showSafetyGuide={showSafetyGuide}
      onSafetyGuide={() => router.replace("/ai-guide")}
    />
  );
}
