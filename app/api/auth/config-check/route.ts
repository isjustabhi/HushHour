import { NextResponse } from "next/server";

/** Non-secret booleans so sign-in can hint at misconfigured Vercel env. */
export async function GET() {
  return NextResponse.json({
    nextauthUrl: process.env.NEXTAUTH_URL ?? null,
    emailFrom: process.env.EMAIL_FROM ?? null,
    hasResendKey: Boolean(process.env.RESEND_API_KEY),
    hasNextAuthSecret: Boolean(process.env.NEXTAUTH_SECRET),
    hasSupabaseUrl: Boolean(
      process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}
