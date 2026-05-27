import { z } from "zod";

export const RoleSchema = z.enum(["seeker", "listener"]);

export const VibeTagSchema = z.enum([
  "school",
  "loneliness",
  "family",
  "relationships",
  "anxiety",
  "just_sad",
  "just_want_to_talk",
  "other",
]);

export const ModerationClass = z.enum([
  "SAFE",
  "CRISIS",
  "ABUSE",
  "PII",
  "INAPPROPRIATE",
]);

export const ModerationAction = z.enum([
  "ALLOW",
  "REDACT",
  "WARN_AND_ALLOW",
  "BLOCK",
  "PAUSE_AND_ROUTE_CRISIS",
]);

export const ModerationResultSchema = z.object({
  classification: ModerationClass,
  confidence: z.number().min(0).max(1),
  action: ModerationAction,
  redacted_message: z.string().nullable(),
  reason_for_user: z.string().max(120),
});

export const MessageSchema = z.object({
  id: z.string().uuid(),
  session_id: z.string().uuid(),
  sender_id: z.string().uuid(),
  body: z.string().min(1).max(1000),
  moderation_class: ModerationClass,
  redacted: z.boolean(),
  delivered: z.boolean(),
  created_at: z.string().datetime(),
});

export const SessionSchema = z.object({
  id: z.string().uuid(),
  user_a_id: z.string().uuid(),
  user_b_id: z.string().uuid(),
  vibe_tag: VibeTagSchema.nullable(),
  started_at: z.string().datetime(),
  ended_at: z.string().datetime().nullable(),
  extended_count: z.number().int().min(0).max(2),
  ended_reason: z
    .enum(["completed", "left_a", "left_b", "crisis_routed", "abuse_blocked"])
    .nullable(),
});

export type Message = z.infer<typeof MessageSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type ModerationResult = z.infer<typeof ModerationResultSchema>;
