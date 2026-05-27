import { createHash } from "node:crypto";

export function normalizeEduEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashEduEmail(email: string): string {
  const normalized = normalizeEduEmail(email);
  return createHash("sha256").update(normalized).digest("hex");
}
