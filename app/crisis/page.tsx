import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getCampusResourceByDomain,
  NATIONAL_CRISIS_RESOURCES,
} from "@/lib/resources";
import { supabaseAdmin } from "@/lib/supabase";

async function getCampusResourceForUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("campuses!inner(edu_domain, name, counseling_url, counseling_phone)")
    .eq("id", userId)
    .maybeSingle<{
      campuses: {
        edu_domain: string;
        name: string;
        counseling_url: string | null;
        counseling_phone: string | null;
      };
    }>();

  if (error || !data?.campuses?.edu_domain) {
    return null;
  }

  const fromMap = getCampusResourceByDomain(data.campuses.edu_domain);
  if (fromMap) {
    return fromMap;
  }

  if (data.campuses.counseling_url && data.campuses.counseling_phone) {
    return {
      name: data.campuses.name,
      counseling_url: data.campuses.counseling_url,
      counseling_phone: data.campuses.counseling_phone,
    };
  }

  return null;
}

export default async function CrisisPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const campusResource = await getCampusResourceForUser(session.user.id);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-5 py-10">
      <main className="mx-auto w-full max-w-xl space-y-6">
        <header className="space-y-2">
          <h1 className="font-heading text-4xl">You&apos;re not alone right now.</h1>
          <p className="text-[var(--hush-muted)]">
            Here are people trained to help.
          </p>
        </header>

        <section className="space-y-3">
          <a
            href="tel:988"
            className="block rounded-xl border border-white/10 bg-[var(--hush-bg-elevated)] px-4 py-4"
          >
            <p className="font-medium">Call 988</p>
            <p className="text-sm text-[var(--hush-muted)]">
              {NATIONAL_CRISIS_RESOURCES.lifeline_988.name}
            </p>
          </a>

          <a
            href={`sms:${NATIONAL_CRISIS_RESOURCES.crisis_text_line.sms}?body=${encodeURIComponent(
              NATIONAL_CRISIS_RESOURCES.crisis_text_line.keyword,
            )}`}
            className="block rounded-xl border border-white/10 bg-[var(--hush-bg-elevated)] px-4 py-4"
          >
            <p className="font-medium">Text HOME to 741741</p>
            <p className="text-sm text-[var(--hush-muted)]">
              {NATIONAL_CRISIS_RESOURCES.crisis_text_line.name}
            </p>
          </a>

          <a
            href={`tel:${NATIONAL_CRISIS_RESOURCES.trevor_project.phone}`}
            className="block rounded-xl border border-white/10 bg-[var(--hush-bg-elevated)] px-4 py-4"
          >
            <p className="font-medium">Trevor Project</p>
            <p className="text-sm text-[var(--hush-muted)]">
              LGBTQ+ youth-specific support
            </p>
          </a>

          {campusResource ? (
            <a
              href={`tel:${campusResource.counseling_phone}`}
              className="block rounded-xl border border-white/10 bg-[var(--hush-bg-elevated)] px-4 py-4"
            >
              <p className="font-medium">{campusResource.name}</p>
              <p className="text-sm text-[var(--hush-muted)]">
                Campus counseling center
              </p>
            </a>
          ) : null}

          <Link
            href="/ai-guide"
            className="block rounded-xl border border-[var(--hush-accent)]/40 bg-[var(--hush-bg-elevated)] px-4 py-4"
          >
            <p className="font-medium">Talk to a Safety Guide</p>
            <p className="text-sm text-[var(--hush-muted)]">
              Claude can stay with you while helping route to humans.
            </p>
          </Link>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[var(--hush-bg-elevated)] px-5 py-6 text-center">
          <p className="text-sm text-[var(--hush-muted)] mb-4">
            Feeling overwhelmed? Take three slow breaths with us.
          </p>
          <div className="mx-auto h-24 w-24 rounded-full border border-[var(--hush-accent)]/40 animate-pulse" />
          <p className="mt-3 text-xs text-[var(--hush-muted)]">30-second breathing reset</p>
        </section>
      </main>
    </div>
  );
}
