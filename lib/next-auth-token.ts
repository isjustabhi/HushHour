import { createHash, randomBytes } from "crypto";

/** Matches next-auth/core/lib/utils hashToken (email provider, no provider.secret). */
export function hashVerificationToken(token: string, secret: string): string {
  return createHash("sha256").update(`${token}${secret}`).digest("hex");
}

export function normalizeSiteUrl(nextAuthUrl?: string): string {
  const raw = nextAuthUrl ?? "http://localhost:3000";
  return raw.replace(/\/api\/auth\/?$/, "").replace(/\/$/, "");
}

export function buildMagicLinkPayload(email: string, callbackUrl: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is not configured");
  }

  const siteUrl = normalizeSiteUrl(process.env.NEXTAUTH_URL);
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 86400 * 1000);
  const hashedToken = hashVerificationToken(token, secret);

  const linkParams = new URLSearchParams({
    token,
    email,
    callbackUrl,
  });

  // Email links here first so inbox scanners do not burn the one-time token.
  const confirmUrl = `${siteUrl}/auth/confirm?${linkParams}`;

  const callbackParams = new URLSearchParams({
    callbackUrl,
    token,
    email,
  });
  const authCallbackUrl = `${siteUrl}/api/auth/callback/email?${callbackParams}`;

  return { confirmUrl, authCallbackUrl, expires, hashedToken };
}

export { randomBytes };
