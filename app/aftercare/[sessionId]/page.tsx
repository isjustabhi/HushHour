import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import AftercareForm from "@/components/AftercareForm";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

interface AftercarePageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function AftercarePage({ params }: AftercarePageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { sessionId } = await params;
  const { data: chatSession, error } = await supabaseAdmin
    .from("sessions")
    .select("id, user_a_id, user_b_id")
    .eq("id", sessionId)
    .maybeSingle<{ id: string; user_a_id: string; user_b_id: string }>();

  if (error || !chatSession) {
    notFound();
  }

  const isParticipant =
    chatSession.user_a_id === session.user.id ||
    chatSession.user_b_id === session.user.id;
  if (!isParticipant) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] px-5 py-10">
      <main className="mx-auto w-full max-w-xl">
        <AftercareForm sessionId={chatSession.id} />
      </main>
    </div>
  );
}
