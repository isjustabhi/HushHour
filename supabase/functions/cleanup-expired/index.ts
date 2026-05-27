import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

Deno.serve(async () => {
  const nowIso = new Date().toISOString();

  const [{ error: queueError }, { error: messageError }] = await Promise.all([
    supabase.from("matching_queue").delete().lte("expires_at", nowIso),
    supabase.from("messages").delete().lte("expires_at", nowIso),
  ]);

  if (queueError || messageError) {
    return new Response(
      JSON.stringify({
        ok: false,
        queueError: queueError?.message ?? null,
        messageError: messageError?.message ?? null,
      }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
