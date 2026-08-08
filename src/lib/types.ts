export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  coins: number;
  follower_count: number;
  following_count: number;
  created_at?: string;
};

export type Game = {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  prompt: string;
  thumbnail_url: string | null;
  play_url: string | null;
  duration_seconds: number;
  status: "draft" | "published";
  view_count: number;
  like_count: number;
  comment_count: number;
  save_count: number;
  share_count: number;
  theme: string;
  created_at: string;
  creator?: Profile | null;
  liked_by_me?: boolean;
  saved_by_me?: boolean;
};

export type Comment = {
  id: string;
  user_id: string;
  game_id: string;
  body: string;
  created_at: string;
  profile?: Profile | null;
};

export type TabId = "feed" | "explore" | "notifications" | "profile" | "create";
