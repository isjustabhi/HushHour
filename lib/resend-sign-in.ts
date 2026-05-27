import { Resend } from "resend";
import { buildMagicLinkPayload } from "@/lib/next-auth-token";

export { buildMagicLinkPayload };

export type SendSignInEmailResult =
  | { ok: true }
  | { ok: false; message: string; hint?: string };

export async function sendSignInEmail(
  to: string,
  verifyUrl: string,
): Promise<SendSignInEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";

  if (!apiKey) {
    return { ok: false, message: "RESEND_API_KEY is not set on the server." };
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from,
    to,
    subject: "Your HushHour sign-in link",
    html: `<p>Sign in to HushHour:</p><p><a href="${verifyUrl}">Continue to sign in</a></p><p>On the next page, tap <strong>Complete sign in</strong>. This link expires in 24 hours.</p>`,
  });

  if (!error) {
    return { ok: true };
  }

  const message = error.message ?? "Resend rejected the send.";
  const lower = message.toLowerCase();
  const hint =
    lower.includes("only") && lower.includes("email")
      ? "Resend test mode only delivers to the email on your Resend account. Sign in with that address, or verify a domain you own in Resend → Domains."
      : lower.includes("domain") || lower.includes("verify")
        ? "Verify your sender in Resend → Domains, or use EMAIL_FROM=onboarding@resend.dev."
        : undefined;

  console.error("[auth] Resend send failed:", error);
  return { ok: false, message, hint };
}

