import { redirect } from "next/navigation";

interface LobbyPageProps {
  searchParams: Promise<{ role?: string; vibe?: string }>;
}

export default async function LobbyPage({ searchParams }: LobbyPageProps) {
  const params = await searchParams;
  const role = params.role ?? "seeker";
  const vibe = params.vibe;
  const query = new URLSearchParams({ role });
  if (vibe) {
    query.set("vibe", vibe);
  }

  redirect(`/matching?${query.toString()}`);
}
