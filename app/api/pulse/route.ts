import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: me } = await supabaseAdmin
    .from("users")
    .select("campus_id")
    .eq("id", session.user.id)
    .maybeSingle<{ campus_id: string }>();

  if (!me?.campus_id) {
    return NextResponse.json({ error: "Campus not found" }, { status: 404 });
  }

  const { data: campusUsers } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("campus_id", me.campus_id)
    .limit(1000);

  const userIds = (campusUsers ?? []).map((u) => u.id);
  if (userIds.length === 0) {
    return NextResponse.json({
      conversations_today: 0,
      top_themes: [],
      vibe_counts: [],
      updated_every_minutes: 5,
    });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const inList = `(${userIds.join(",")})`;
  const { data: sessions } = await supabaseAdmin
    .from("sessions")
    .select("id, vibe_tag")
    .gte("started_at", since)
    .or(`user_a_id.in.${inList},user_b_id.in.${inList}`);

  const total = sessions?.length ?? 0;
  const counts = new Map<string, number>();
  for (const row of sessions ?? []) {
    const key = row.vibe_tag ?? "other";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const topThemes = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme]) => theme);

  const vibeCounts = [...counts.entries()].map(([tag, count]) => ({ tag, count }));

  return NextResponse.json({
    conversations_today: total,
    top_themes: topThemes,
    vibe_counts: vibeCounts,
    updated_every_minutes: 5,
  });
}
