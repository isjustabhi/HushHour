import { supabaseAdmin } from "@/lib/supabase";

export async function isEduHashBanned(eduHash: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("banned_until")
    .eq("edu_hash", eduHash)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check ban list: ${error.message}`);
  }

  if (!data?.banned_until) {
    return false;
  }

  return new Date(data.banned_until).getTime() > Date.now();
}
