import { createClient } from "@supabase/supabase-js";

/** Supabase client for the next_auth schema (NextAuth adapter tables). */
export function getNextAuthDb() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase URL or service role key");
  }

  return createClient(url, key, {
    db: { schema: "next_auth" },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function deleteVerificationTokensForEmail(email: string) {
  const db = getNextAuthDb();
  const { error } = await db
    .from("verification_tokens")
    .delete()
    .eq("identifier", email);
  if (error) {
    throw new Error(`Failed to clear old sign-in links: ${error.message}`);
  }
}
