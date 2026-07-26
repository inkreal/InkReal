export type UserRole = "reader" | "writer" | "founder";

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  country: string | null;
  preferred_language: string;
  preferred_currency: string;
  created_at: string;
}

export interface FeedIndex {
  id: string;
  content_type: "post" | "poem" | "book";
  source_table: "posts" | "poems" | "books";
  source_id: string;
  creator_id: string;
  created_at: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  visibility: string;
}

export interface FeedItem extends FeedIndex {
  creator?: Pick<Profile, "id" | "display_name" | "avatar_url" | "role">;
}

export interface Post {
  id: string;
  creator_id: string;
  title: string;
  body: string;
  created_at: string;
}

export interface Poem {
  id: string;
  creator_id: string;
  title: string;
  body: string;
  created_at: string;
}

export interface Book {
  id: string;
  creator_id: string;
  title: string;
  synopsis: string | null;
  genre: string | null;
  cover_url: string | null;
  buy_price: number | null;
  rental_price: number | null;
  status: string;
  created_at: string;
}

export interface Comment {
  id: string;
  target_feed_index_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export interface Like {
  id: string;
  target_feed_index_id: string;
  user_id: string;
  created_at: string;
}

export interface Save {
  id: string;
  target_feed_index_id: string;
  user_id: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface Badge {
  id: string;
  user_id: string;
  badge_type: string;
  unlocked_at: string;
}

export interface Follow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface ResolvedRoles {
  role: UserRole;
  is_founder: boolean;
  is_writer: boolean;
  display_name: string | null;
}
