import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { findMatch, type Waiter } from "@/lib/matcher";
import { RoleSchema, VibeTagSchema } from "@/lib/schemas";
import { supabaseAdmin } from "@/lib/supabase";

const MatchRequestSchema = z.object({
  role: RoleSchema,
  vibe_tag: VibeTagSchema.nullable().optional(),
});

type QueueRow = {
  id: string;
  user_id: string;
  campus_id: string;
  role: "seeker" | "listener";
  vibe_tag: z.infer<typeof VibeTagSchema> | null;
  enqueued_at: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = MatchRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { role, vibe_tag } = parsed.data;

  const { data: meRow, error: meError } = await supabaseAdmin
    .from("users")
    .select("id, campus_id")
    .eq("id", session.user.id)
    .single<{ id: string; campus_id: string }>();

  if (meError || !meRow) {
    return NextResponse.json(
      { error: meError?.message ?? "User not found" },
      { status: 404 },
    );
  }

  // Prevent duplicate active queue rows for this user.
  await supabaseAdmin.from("matching_queue").delete().eq("user_id", meRow.id);

  const { data: insertedQueueRow, error: insertError } = await supabaseAdmin
    .from("matching_queue")
    .insert({
      user_id: meRow.id,
      campus_id: meRow.campus_id,
      role,
      vibe_tag: vibe_tag ?? null,
    })
    .select("id, user_id, campus_id, role, vibe_tag, enqueued_at")
    .single<QueueRow>();

  if (insertError || !insertedQueueRow) {
    return NextResponse.json(
      { error: insertError?.message ?? "Failed to enqueue" },
      { status: 500 },
    );
  }

  const { data: queueRows, error: queueError } = await supabaseAdmin
    .from("matching_queue")
    .select("id, user_id, campus_id, role, vibe_tag, enqueued_at")
    .eq("campus_id", meRow.campus_id)
    .order("enqueued_at", { ascending: true });

  if (queueError || !queueRows) {
    return NextResponse.json(
      { error: queueError?.message ?? "Failed to read queue" },
      { status: 500 },
    );
  }

  const queue = queueRows.map<Waiter>((row) => ({
    id: row.id,
    user_id: row.user_id,
    campus_id: row.campus_id,
    role: row.role,
    vibe_tag: row.vibe_tag,
    enqueued_at: new Date(row.enqueued_at),
  }));

  const me = queue.find((w) => w.id === insertedQueueRow.id);
  if (!me) {
    return NextResponse.json({ waiting: true });
  }

  const match = findMatch(me, queue);
  if (!match) {
    return NextResponse.json({ waiting: true, queue_id: insertedQueueRow.id });
  }

  const { data: createdSession, error: sessionError } = await supabaseAdmin
    .from("sessions")
    .insert({
      user_a_id: me.user_id,
      user_b_id: match.user_id,
      vibe_tag: me.vibe_tag ?? match.vibe_tag ?? null,
    })
    .select("id")
    .single<{ id: string }>();

  if (sessionError || !createdSession) {
    return NextResponse.json(
      { error: sessionError?.message ?? "Failed to create session" },
      { status: 500 },
    );
  }

  const { error: deleteQueueError } = await supabaseAdmin
    .from("matching_queue")
    .delete()
    .in("id", [me.id, match.id]);

  if (deleteQueueError) {
    return NextResponse.json(
      { error: deleteQueueError.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ session_id: createdSession.id });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: activeSession, error } = await supabaseAdmin
    .from("sessions")
    .select("id")
    .or(`user_a_id.eq.${session.user.id},user_b_id.eq.${session.user.id}`)
    .is("ended_at", null)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (activeSession?.id) {
    return NextResponse.json({ session_id: activeSession.id });
  }

  return NextResponse.json({ waiting: true });
}
