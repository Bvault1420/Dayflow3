import { createClient } from "@/lib/supabase/client";
import type { Game } from "@/lib/types";

/** Explicit relationship hints — avoids PostgREST "more than one relationship" errors. */
export const GAME_WITH_CREATOR =
  "*, creator:profiles!creator_id(*)" as const;

export const COMMENT_WITH_PROFILE =
  "*, profile:profiles!user_id(*)" as const;

export const LIKE_WITH_GAME =
  "game:games!game_id(*, creator:profiles!creator_id(*))" as const;

export const SAVE_WITH_GAME =
  "game:games!game_id(*, creator:profiles!creator_id(*))" as const;

export const VIEW_WITH_GAME =
  "game:games!game_id(*, creator:profiles!creator_id(*))" as const;

function unwrapGames(rows: Array<{ game: Game | null }> | null): Game[] {
  return (rows ?? []).map((r) => r.game).filter((g): g is Game => !!g);
}

export async function fetchCreatedGames(userId: string): Promise<Game[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("games")
    .select(GAME_WITH_CREATOR)
    .eq("creator_id", userId)
    .order("created_at", { ascending: false });
  return (data as Game[]) ?? [];
}

export async function fetchLikedGames(userId: string): Promise<Game[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("likes")
    .select(LIKE_WITH_GAME)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return unwrapGames(data as Array<{ game: Game | null }> | null);
}

export async function fetchSavedGames(userId: string): Promise<Game[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("saves")
    .select(SAVE_WITH_GAME)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return unwrapGames(data as Array<{ game: Game | null }> | null);
}

export async function fetchViewHistory(userId: string): Promise<Game[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("views")
    .select(VIEW_WITH_GAME)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(40);
  return unwrapGames(data as Array<{ game: Game | null }> | null);
}

export async function fetchTrendingGames(limit = 24): Promise<Game[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("games")
    .select(GAME_WITH_CREATOR)
    .eq("status", "published")
    .order("like_count", { ascending: false })
    .limit(limit);
  return (data as Game[]) ?? [];
}

export type ActivityItem = {
  id: string;
  kind: "like" | "comment" | "follow";
  actor_name: string;
  body: string;
  created_at: string;
};

export async function fetchActivityForUser(userId: string): Promise<ActivityItem[]> {
  const supabase = createClient();
  const { data: myGames } = await supabase
    .from("games")
    .select("id, title")
    .eq("creator_id", userId);

  const gameMap = new Map((myGames ?? []).map((g) => [g.id as string, g.title as string]));
  const gameIds = [...gameMap.keys()];
  const items: ActivityItem[] = [];

  if (gameIds.length) {
    const [{ data: likes }, { data: comments }] = await Promise.all([
      supabase
        .from("likes")
        .select("created_at, game_id, user_id, user:profiles!user_id(display_name, username)")
        .in("game_id", gameIds)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("comments")
        .select("id, created_at, body, game_id, user:profiles!user_id(display_name, username)")
        .in("game_id", gameIds)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    for (const row of likes ?? []) {
      const user = row.user as { display_name?: string; username?: string } | null;
      const name = user?.display_name || user?.username || "Someone";
      items.push({
        id: `like-${row.user_id}-${row.game_id}`,
        kind: "like",
        actor_name: name,
        body: `liked ${gameMap.get(row.game_id as string) ?? "your game"}`,
        created_at: row.created_at as string,
      });
    }

    for (const row of comments ?? []) {
      const user = row.user as { display_name?: string; username?: string } | null;
      const name = user?.display_name || user?.username || "Someone";
      items.push({
        id: `comment-${row.id}`,
        kind: "comment",
        actor_name: name,
        body: `commented on ${gameMap.get(row.game_id as string) ?? "your game"}: “${String(row.body).slice(0, 80)}”`,
        created_at: row.created_at as string,
      });
    }
  }

  const { data: follows } = await supabase
    .from("follows")
    .select("follower_id, created_at, follower:profiles!follower_id(display_name, username)")
    .eq("following_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  for (const row of follows ?? []) {
    const follower = row.follower as { display_name?: string; username?: string } | null;
    const name = follower?.display_name || follower?.username || "Someone";
    items.push({
      id: `follow-${row.follower_id}-${row.created_at}`,
      kind: "follow",
      actor_name: name,
      body: "started following you",
      created_at: row.created_at as string,
    });
  }

  return items.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0, 40);
}
