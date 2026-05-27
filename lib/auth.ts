import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { SupabaseAdapter } from "@next-auth/supabase-adapter";
import { Resend } from "resend";
import { isAllowedEduDomain } from "@/lib/edu-domains";
import { hashEduEmail } from "@/lib/hash";
import { isEduHashBanned } from "@/lib/ban-list";
import { supabaseAdmin } from "@/lib/supabase";

type AppUserRow = {
  id: string;
  has_seen_brief: boolean;
};

function getDomainFromEmail(email: string): string {
  return email.split("@")[1]?.toLowerCase().trim() ?? "";
}

async function ensureCampus(domain: string): Promise<string> {
  const { data: existing, error: lookupError } = await supabaseAdmin
    .from("campuses")
    .select("id")
    .eq("edu_domain", domain)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Failed campus lookup: ${lookupError.message}`);
  }

  if (existing?.id) {
    return existing.id;
  }

  const fallbackName = `${domain} Campus`;
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("campuses")
    .insert({
      name: fallbackName,
      edu_domain: domain,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Failed campus create: ${insertError.message}`);
  }

  return inserted.id;
}

async function upsertUserByEmail(email: string): Promise<AppUserRow> {
  const domain = getDomainFromEmail(email);
  const eduHash = hashEduEmail(email);

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("users")
    .select("id, has_seen_brief")
    .eq("edu_hash", eduHash)
    .maybeSingle<AppUserRow>();

  if (existingError) {
    throw new Error(`Failed user lookup: ${existingError.message}`);
  }

  if (existing) {
    return existing;
  }

  const campusId = await ensureCampus(domain);
  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("users")
    .insert({
      edu_hash: eduHash,
      campus_id: campusId,
      has_seen_brief: false,
    })
    .select("id, has_seen_brief")
    .single<AppUserRow>();

  if (insertError) {
    throw new Error(`Failed user create: ${insertError.message}`);
  }

  return inserted;
}

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  }),
  session: {
    strategy: "jwt",
  },
  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM ?? "noreply@example.com",
      async sendVerificationRequest({ identifier, url, provider }) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: provider.from as string,
          to: identifier,
          subject: "Your HushHour sign-in link",
          html: `<p>Sign in to HushHour with this secure link:</p><p><a href="${url}">${url}</a></p>`,
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase().trim();

      if (!email) {
        return false;
      }

      const domain = getDomainFromEmail(email);
      if (!isAllowedEduDomain(domain)) {
        return false;
      }

      const banned = await isEduHashBanned(hashEduEmail(email));
      return !banned;
    },
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;
      if (!email) {
        return token;
      }

      const appUser = await upsertUserByEmail(email);
      token.appUserId = appUser.id;
      token.hasSeenBrief = appUser.has_seen_brief;

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.appUserId as string;

        if (token.appUserId) {
          const { data } = await supabaseAdmin
            .from("users")
            .select("has_seen_brief")
            .eq("id", token.appUserId)
            .maybeSingle<{ has_seen_brief: boolean }>();

          session.user.hasSeenBrief = Boolean(data?.has_seen_brief);
        } else {
          session.user.hasSeenBrief = Boolean(token.hasSeenBrief);
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
  },
};
