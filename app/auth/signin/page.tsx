"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isAllowedSignInEmail } from "@/lib/edu-domains";

function messageForSignInError(code: string | undefined): string {
  switch (code) {
    case "AccessDenied":
      return "That email is not allowed (campus not on the list, or account restricted).";
    case "EmailSignin":
      return "Could not send the magic link. Use EMAIL_FROM=onboarding@resend.dev (no custom domain). On Resend's free plan, mail only goes to the email on your Resend account unless you verify a domain you own.";
    case "Configuration":
      return "Auth is misconfigured on the server. In Supabase, run migrations 004 and 005 and expose the next_auth schema; in Vercel, set SUPABASE_SERVICE_ROLE_KEY (not the anon key).";
    default:
      return code
        ? `Sign-in failed (${code}). Open Vercel → Logs → POST /api/auth/signin/email for details.`
        : "Sign-in failed. Try again or check Vercel logs.";
  }
}

function SignInPageInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      setError(messageForSignInError(urlError));
    }
  }, [searchParams]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const normalized = email.trim().toLowerCase();
    if (!isAllowedSignInEmail(normalized)) {
      setError(
        "Use an allowed .edu address or Gmail (gmail.com) for demo sign-in.",
      );
      setIsLoading(false);
      return;
    }

    const response = await fetch("/api/auth/magic-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalized, callbackUrl: "/" }),
    });

    const payload = (await response.json()) as {
      ok?: boolean;
      error?: string;
      hint?: string;
    };

    setIsLoading(false);

    if (!response.ok) {
      setError(
        [payload.error, payload.hint].filter(Boolean).join(" ") ||
          "Sign-in failed. Try again.",
      );
      return;
    }

    window.location.href = "/auth/verify";
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <main className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="text-neutral-400">
          Enter your .edu or Gmail address to receive a secure magic link.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu or you@gmail.com"
            required
          />
          <Button disabled={isLoading} className="w-full" type="submit">
            {isLoading ? "Sending..." : "Send magic link"}
          </Button>
        </form>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </main>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInPageInner />
    </Suspense>
  );
}
