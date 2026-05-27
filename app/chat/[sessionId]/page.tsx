import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import ChatRoom from "@/components/ChatRoom";
import { authOptions } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";

interface ChatPageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/auth/signin");
  }

  const { sessionId } = await params;

  const { data: chatSession, error: sessionError } = await supabaseAdmin
    .from("sessions")
    .select("id, user_a_id, user_b_id, started_at, ended_at, extended_count")
    .eq("id", sessionId)
    .maybeSingle<{
      id: string;
      user_a_id: string;
      user_b_id: string;
      started_at: string;
      ended_at: string | null;
      extended_count: number;
    }>();

  if (sessionError || !chatSession) {
    notFound();
  }

  const isParticipant =
    chatSession.user_a_id === session.user.id ||
    chatSession.user_b_id === session.user.id;

  if (!isParticipant) {
    redirect("/");
  }

  if (chatSession.ended_at) {
    redirect(`/aftercare/${chatSession.id}`);
  }

  const { data: messageRows } = await supabaseAdmin
    .from("messages")
    .select("id, sender_id, body")
    .eq("session_id", chatSession.id)
    .eq("delivered", true)
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <ChatRoom
      sessionId={chatSession.id}
      currentUserId={session.user.id}
      startedAtIso={chatSession.started_at}
      initialExtendedCount={chatSession.extended_count}
      initialMessages={messageRows ?? []}
    />
  );
}
