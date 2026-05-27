import { NextResponse } from "next/server";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { isAllowedEduDomain } from "@/lib/edu-domains";
import { hashEduEmail } from "@/lib/hash";
import { isEduHashBanned } from "@/lib/ban-list";
import {
  buildEmailCallbackUrl,
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

  const domain = email.split("@")[1] ?? "";
  if (!domain.endsWith(".edu")) {
    return NextResponse.json(
      { error: "Use a university .edu email address." },
      { status: 400 },
    );
  }

  if (!isAllowedEduDomain(domain)) {
    return NextResponse.json(
      {
        error: `"${domain}" is not on the campus allowlist. Use your school's main domain (e.g. name@arizona.edu).`,
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

    const { verifyUrl, expires, hashedToken } = buildEmailCallbackUrl(
      email,
      callbackUrl,
    );

    await adapter.createVerificationToken?.({
      identifier: email,
      token: hashedToken,
      expires,
    });

    const sent = await sendSignInEmail(email, verifyUrl);
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
