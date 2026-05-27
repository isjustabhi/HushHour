"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

function ConfirmSignInInner() {
  const params = useSearchParams();
  const token = params.get("token");
  const email = params.get("email");
  const callbackUrl = params.get("callbackUrl") ?? "/";

  if (!token || !email) {
    return (
      <p className="text-sm text-red-400">
        This link is malformed. Request a new sign-in link from the app.
      </p>
    );
  }

  const completeHref = `/api/auth/callback/email?${new URLSearchParams({
    token,
    email,
    callbackUrl,
  })}`;

  return (
    <>
      <p className="text-neutral-400 text-sm">
        Signing in as <span className="text-neutral-200">{email}</span>
      </p>
      <Button
        className="w-full"
        type="button"
        onClick={() => {
          window.location.href = completeHref;
        }}
      >
        Complete sign in
      </Button>
      <p className="text-xs text-neutral-500">
        Use the button above. Email apps sometimes open links automatically and
        invalidate them before you tap.
      </p>
    </>
  );
}

export default function ConfirmSignInPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <main className="w-full max-w-md space-y-6 text-center">
        <h1 className="text-3xl font-semibold">Finish signing in</h1>
        <Suspense fallback={<p className="text-neutral-400">Loading…</p>}>
          <ConfirmSignInInner />
        </Suspense>
      </main>
    </div>
  );
}
