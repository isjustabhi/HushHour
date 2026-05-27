import { NextResponse } from "next/server";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { isAllowedSignInEmail } from "@/lib/edu-domains";
import { hashEduEmail } from "@/lib/hash";
import { isEduHashBanned } from "@/lib/ban-list";
import { deleteVerificationTokensForEmail } from "@/lib/next-auth-db";
import {
  buildMagicLinkPayload,
  sendSignInEmail,
} from "@/lib/resend-sign-in";

function getAdapter() {
  return SupabaseAdapter({
    url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  });
}

export async function POST(request: Request) {
  let body: { email?: string; callbackUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const callbackUrl = body.callbackUrl ?? "/";

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!isAllowedSignInEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Use an allowed .edu address or Gmail (gmail.com) for demo sign-in.",
      },
      { status: 400 },
    );
  }

  if (await isEduHashBanned(hashEduEmail(email))) {
    return NextResponse.json({ error: "Account restricted." }, { status: 403 });
  }

  if (!process.env.NEXTAUTH_SECRET) {
    return NextResponse.json(
      { error: "NEXTAUTH_SECRET is not configured on the server." },
      { status: 500 },
    );
  }

  const adapter = getAdapter();

  try {
    const existing = await adapter.getUserByEmail?.(email);
    if (!existing && adapter.createUser) {
      await adapter.createUser({
        email,
        emailVerified: null,
      });
    }

    await deleteVerificationTokensForEmail(email);

    const { confirmUrl, expires, hashedToken } = buildMagicLinkPayload(
      email,
      callbackUrl,
    );

    await adapter.createVerificationToken?.({
      identifier: email,
      token: hashedToken,
      expires,
    });

    const sent = await sendSignInEmail(email, confirmUrl);
    if (!sent.ok) {
      return NextResponse.json(
        { error: sent.message, hint: sent.hint },
        { status: 422 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create sign-in link";
    console.error("[auth] magic-link error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
