import { getServerSession } from "next-auth";
import AuthButton from "@/components/AuthButton";
import LandingPanel from "@/components/LandingPanel";
import SafetyBriefModal from "@/components/SafetyBriefModal";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = Boolean(session?.user);
  const needsBrief = Boolean(isAuthenticated && session?.user && !session.user.hasSeenBrief);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] text-[var(--foreground)] px-6 py-10">
      <main className="w-full max-w-2xl space-y-10 text-center">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--hush-muted)]">
            HushHour
          </p>
          <h1 className="font-heading text-5xl leading-tight">
            Five minutes. One stranger.
          </h1>
          <p className="text-[var(--hush-muted)]">Nobody alone tonight.</p>
        </div>

        {isAuthenticated ? (
          <LandingPanel />
        ) : (
          <div className="space-y-4">
            <AuthButton isAuthenticated={false} />
            <p className="text-sm text-[var(--hush-muted)]">
              Sign in with your university email to begin.
            </p>
          </div>
        )}

        <SafetyBriefModal open={Boolean(needsBrief)} />
      </main>
    </div>
  );
}
