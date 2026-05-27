type Role = "seeker" | "listener";
type VibeTag =
  | "school"
  | "loneliness"
  | "family"
  | "relationships"
  | "anxiety"
  | "just_sad"
  | "just_want_to_talk"
  | "other";

export interface Waiter {
  id: string;
  user_id: string;
  campus_id: string;
  role: Role;
  vibe_tag: VibeTag | null;
  enqueued_at: Date;
}

/**
 * Match a waiting user with another waiter.
 *
 * Priority (highest first):
 *   1. Same campus (HARD — never cross-campus in v1)
 *   2. Seeker ↔ Listener pairs preferred over Seeker ↔ Seeker
 *   3. Same vibe_tag if both set, otherwise allow null
 *   4. Longest waiting on each side
 */
export function findMatch(me: Waiter, queue: Waiter[]): Waiter | null {
  const candidates = queue.filter(
    (w) => w.user_id !== me.user_id && w.campus_id === me.campus_id,
  );
  if (candidates.length === 0) return null;

  const opposites = candidates.filter((w) => w.role !== me.role);
  const pool = opposites.length > 0 ? opposites : candidates;

  const sameVibe = pool.filter(
    (w) => me.vibe_tag !== null && w.vibe_tag === me.vibe_tag,
  );
  const finalPool = sameVibe.length > 0 ? sameVibe : pool;

  return finalPool.sort(
    (a, b) => a.enqueued_at.getTime() - b.enqueued_at.getTime(),
  )[0];
}
