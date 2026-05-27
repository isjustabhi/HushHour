"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await signIn("resend", {
      email,
      redirect: false,
      callbackUrl: "/",
    });

    setIsLoading(false);

    if (result?.error) {
      setError("Sign-in failed. Use a valid, allowed .edu email.");
      return;
    }

    window.location.href = "/auth/verify";
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center px-6">
      <main className="w-full max-w-md space-y-6">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="text-neutral-400">
          Enter your university email to receive a secure magic link.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@university.edu"
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
