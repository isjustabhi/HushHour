import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { parse } from "partial-json";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { MODERATION_SYSTEM_PROMPT } from "@/lib/moderation-prompt";
import {
  ModerationResultSchema,
  RoleSchema,
  VibeTagSchema,
} from "@/lib/schemas";
import { supabaseAdmin } from "@/lib/supabase";

const SendRequestSchema = z.object({
  session_id: z.string().uuid(),
  message_body: z.string().min(1).max(1000),
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function extractJsonObject(raw: string): string {
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return raw;
  }
  return raw.slice(firstBrace, lastBrace + 1);
}

async function moderate(input: {
  message_body: string;
  sender_role: z.infer<typeof RoleSchema>;
  session_vibe_tag: z.infer<typeof VibeTagSchema> | null;
  recent_messages: string[];
}) {
  const stream = await anthropic.messages.stream({
    model: "claude-3-5-haiku-latest",
    max_tokens: 300,
    temperature: 0,
    system: MODERATION_SYSTEM_PROMPT,
    messages: [{ role: "user", content: JSON.stringify(input) }],
  });

  let accumulatedText = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      accumulatedText += event.delta.text;
    }
  }

  const rawJson = extractJsonObject(accumulatedText.trim());
  let moderationCandidate: unknown;
  try {
    moderationCandidate = JSON.parse(rawJson);
  } catch {
    moderationCandidate = parse(rawJson);
  }

  return ModerationResultSchema.parse(moderationCandidate);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = SendRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { session_id, message_body } = parsed.data;

  const { data: chatSession, error: sessionError } = await supabaseAdmin
    .from("sessions")
    .select("id, user_a_id, user_b_id, vibe_tag, ended_at")
    .eq("id", session_id)
    .single<{
      id: string;
      user_a_id: string;
      user_b_id: string;
      vibe_tag: z.infer<typeof VibeTagSchema> | null;
      ended_at: string | null;
    }>();

  if (sessionError || !chatSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (chatSession.ended_at) {
    return NextResponse.json({ error: "Session ended" }, { status: 400 });
  }

  const senderId = session.user.id;
  const isParticipant =
    chatSession.user_a_id === senderId || chatSession.user_b_id === senderId;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const senderRole: z.infer<typeof RoleSchema> =
    chatSession.user_a_id === senderId ? "seeker" : "listener";

  const { data: recentRows } = await supabaseAdmin
    .from("messages")
    .select("body")
    .eq("session_id", session_id)
    .eq("delivered", true)
    .order("created_at", { ascending: false })
    .limit(3);

  const recentMessages = (recentRows ?? [])
    .map((row) => row.body)
    .reverse();

  const moderation = await moderate({
    message_body,
    sender_role: senderRole,
    session_vibe_tag: chatSession.vibe_tag,
    recent_messages: recentMessages,
  });

  if (moderation.action === "BLOCK") {
    return NextResponse.json({
      delivered: false,
      blocked: true,
      moderation,
      reason: moderation.reason_for_user,
    });
  }

  if (moderation.action === "PAUSE_AND_ROUTE_CRISIS") {
    await supabaseAdmin.from("moderation_events").insert({
      session_id,
      classification: moderation.classification,
      confidence: moderation.confidence,
      action_taken: moderation.action,
      redacted_snippet: message_body.slice(0, 50),
    });

    await supabaseAdmin
      .from("sessions")
      .update({
        ended_reason: "crisis_routed",
        ended_at: new Date().toISOString(),
      })
      .eq("id", session_id);

    return NextResponse.json({
      delivered: false,
      crisis_routed: true,
      moderation,
      resources: {
        lifeline: "988",
        crisis_text_line: "Text HOME to 741741",
        trevor_project: "1-866-488-7386",
      },
    });
  }

  const insertBody =
    moderation.action === "REDACT" ? moderation.redacted_message ?? "[redacted]" : message_body;

  const redacted = moderation.action === "REDACT";
  const delivered = true;

  const { data: insertedMessage, error: insertError } = await supabaseAdmin
    .from("messages")
    .insert({
      session_id,
      sender_id: senderId,
      body: insertBody,
      moderation_class: moderation.classification,
      redacted,
      delivered,
    })
    .select("*")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    delivered: true,
    moderation,
    warning:
      moderation.action === "WARN_AND_ALLOW" ? moderation.reason_for_user : null,
    message: insertedMessage,
  });
}
