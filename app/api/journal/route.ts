import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const JournalRequestSchema = z.object({
  session_id: z.string().uuid(),
  feeling: z.enum(["rain", "neutral", "partly_sunny", "sunny"]).optional(),
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = JournalRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { session_id, feeling } = parsed.data;

  const { data: chatSession } = await supabaseAdmin
    .from("sessions")
    .select("id, user_a_id, user_b_id, vibe_tag, started_at, ended_at, ended_reason")
    .eq("id", session_id)
    .maybeSingle<{
      id: string;
      user_a_id: string;
      user_b_id: string;
      vibe_tag: string | null;
      started_at: string;
      ended_at: string | null;
      ended_reason: string | null;
    }>();

  if (!chatSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const isParticipant =
    chatSession.user_a_id === session.user.id || chatSession.user_b_id === session.user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: moderationEvents } = await supabaseAdmin
    .from("moderation_events")
    .select("classification, action_taken")
    .eq("session_id", session_id)
    .limit(100);

  const metadataOnlyPayload = {
    vibe_tag: chatSession.vibe_tag,
    ended_reason: chatSession.ended_reason,
    duration_minutes: chatSession.ended_at
      ? Math.max(
          1,
          Math.round(
            (new Date(chatSession.ended_at).getTime() -
              new Date(chatSession.started_at).getTime()) /
              60000,
          ),
        )
      : null,
    feeling: feeling ?? null,
    moderation_events: moderationEvents ?? [],
  };

  const completion = await anthropic.messages.create({
    model: "claude-3-5-haiku-latest",
    temperature: 0.3,
    max_tokens: 140,
    system:
      "You write private reflection theme summaries. Use only provided metadata. Never infer or quote message text. Output one short paragraph (max 70 words), warm and neutral.",
    messages: [
      {
        role: "user",
        content: JSON.stringify(metadataOnlyPayload),
      },
    ],
  });

  const themeSummary = completion.content
    .filter((c) => c.type === "text")
    .map((c) => c.text)
    .join(" ")
    .trim();

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("journal_entries")
    .insert({
      user_id: session.user.id,
      session_id,
      feeling: feeling ?? null,
      theme_summary:
        themeSummary ||
        "You showed up for yourself tonight. Even a brief moment of connection can matter.",
    })
    .select("id, feeling, theme_summary, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, entry: inserted });
}
