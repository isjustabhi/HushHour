import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const ExtendRequestSchema = z.object({
  session_id: z.string().uuid(),
  vote: z.boolean(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = ExtendRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { session_id, vote } = parsed.data;

  const { data: chatSession, error } = await supabaseAdmin
    .from("sessions")
    .select("id, user_a_id, user_b_id, extended_count, ended_at")
    .eq("id", session_id)
    .maybeSingle<{
      id: string;
      user_a_id: string;
      user_b_id: string;
      extended_count: number;
      ended_at: string | null;
    }>();

  if (error || !chatSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (chatSession.ended_at) {
    return NextResponse.json({ error: "Session already ended" }, { status: 400 });
  }

  const isParticipant =
    chatSession.user_a_id === session.user.id ||
    chatSession.user_b_id === session.user.id;
  if (!isParticipant) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (chatSession.extended_count >= 2) {
    return NextResponse.json({ extended: false, maxed: true });
  }

  const windowIndex = chatSession.extended_count + 1;

  const { error: upsertError } = await supabaseAdmin.from("extend_votes").upsert(
    {
      session_id,
      user_id: session.user.id,
      window_index: windowIndex,
      vote,
    },
    { onConflict: "session_id,user_id,window_index" },
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  const { data: votes } = await supabaseAdmin
    .from("extend_votes")
    .select("user_id, vote")
    .eq("session_id", session_id)
    .eq("window_index", windowIndex);

  const hasA = Boolean(votes?.some((v) => v.user_id === chatSession.user_a_id));
  const hasB = Boolean(votes?.some((v) => v.user_id === chatSession.user_b_id));
  const bothVoted = hasA && hasB;
  const allYes = bothVoted && votes?.every((v) => v.vote === true);

  if (allYes) {
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from("sessions")
      .update({ extended_count: chatSession.extended_count + 1 })
      .eq("id", session_id)
      .select("extended_count")
      .single<{ extended_count: number }>();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      extended: true,
      extended_count: updatedSession.extended_count,
    });
  }

  return NextResponse.json({
    extended: false,
    waiting_for_other: !bothVoted,
    declined: bothVoted && !allYes,
  });
}
