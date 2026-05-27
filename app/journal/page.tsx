import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

export default async function JournalPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { data: entries } = await supabaseAdmin
    .from("journal_entries")
    .select("id, feeling, theme_summary, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-5 py-10">
      <main className="mx-auto w-full max-w-2xl space-y-5">
        <header className="space-y-2">
          <h1 className="font-heading text-4xl">Private Journal</h1>
          <p className="text-sm text-[var(--hush-muted)]">
            Theme summaries are generated from session metadata only.
          </p>
        </header>

        <div className="space-y-3">
          {(entries ?? []).map((entry) => (
            <article
              key={entry.id}
              className="rounded-xl border border-white/10 bg-[var(--hush-bg-elevated)] px-4 py-3"
            >
              <p className="text-xs text-[var(--hush-muted)]">
                {new Date(entry.created_at).toLocaleString()}
              </p>
              <p className="mt-2 text-sm">{entry.theme_summary}</p>
            </article>
          ))}
          {!entries?.length ? (
            <p className="text-sm text-[var(--hush-muted)]">
              No reflections yet. After your next chat, save one from aftercare.
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
