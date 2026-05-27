import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const ReportRequestSchema = z.object({
  session_id: z.string().uuid(),
  reason: z.string().min(3).max(500),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ReportRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { session_id, reason } = parsed.data;

  const { data: chatSession, error: sessionError } = await supabaseAdmin
    .from("sessions")
    .select("id, user_a_id, user_b_id")
    .eq("id", session_id)
    .maybeSingle<{ id: string; user_a_id: string; user_b_id: string }>();

  if (sessionError || !chatSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const reporterId = session.user.id;
  const isParticipant =
    chatSession.user_a_id === reporterId || chatSession.user_b_id === reporterId;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetUserId =
    chatSession.user_a_id === reporterId ? chatSession.user_b_id : chatSession.user_a_id;

  const { error: reportError } = await supabaseAdmin.from("reports").insert({
    reporter_user_id: reporterId,
    session_id,
    reason,
    reviewed: false,
  });

  if (reportError) {
    return NextResponse.json({ error: reportError.message }, { status: 500 });
  }

  const { data: severeModeration } = await supabaseAdmin
    .from("moderation_events")
    .select("classification")
    .eq("session_id", session_id)
    .eq("classification", "ABUSE")
    .limit(1);

  if (severeModeration && severeModeration.length > 0) {
    const now = Date.now();
    const bannedUntil = new Date(now + 1000 * 60 * 60 * 24 * 7).toISOString();
    await supabaseAdmin
      .from("users")
      .update({ banned_until: bannedUntil })
      .eq("id", targetUserId);
  }

  return NextResponse.json({ ok: true });
}
