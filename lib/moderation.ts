import { z } from "zod";
import {
  ModerationResultSchema,
  RoleSchema,
  VibeTagSchema,
} from "@/lib/schemas";

type SenderRole = z.infer<typeof RoleSchema>;
type SessionVibeTag = z.infer<typeof VibeTagSchema> | null;

interface ModerateInput {
  message_body: string;
  sender_role: SenderRole;
  session_vibe_tag: SessionVibeTag;
  recent_messages: string[];
}

export async function moderateMessage(input: ModerateInput) {
  const response = await fetch("/api/moderate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error ?? "Moderation request failed");
  }

  return ModerationResultSchema.parse(data);
}
