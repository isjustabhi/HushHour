import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

const EndRequestSchema = z.object({
  session_id: z.string().uuid(),
  ended_reason: z
    .enum(["completed", "left_a", "left_b", "crisis_routed", "abuse_blocked"])
    .optional(),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = EndRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { session_id, ended_reason } = parsed.data;
  const now = new Date().toISOString();

  const { error } = await supabaseAdmin
    .from("sessions")
    .update({
      ended_at: now,
      ended_reason: ended_reason ?? "completed",
    })
    .eq("id", session_id)
    .or(`user_a_id.eq.${session.user.id},user_b_id.eq.${session.user.id}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
