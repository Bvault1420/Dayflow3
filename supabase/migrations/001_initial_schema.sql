-- Playverse / Aippy-style schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query)

create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text default '',
  level int not null default 1,
  coins int not null default 100,
  follower_count int not null default 0,
  following_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Games / Experiences (10–60s playable clips)
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text default '',
  prompt text default '',
  thumbnail_url text,
  play_url text,
  duration_seconds int not null default 30 check (duration_seconds between 10 and 60),
  status text not null default 'published' check (status in ('draft', 'published')),
  view_count bigint not null default 0,
  like_count bigint not null default 0,
  comment_count bigint not null default 0,
  save_count bigint not null default 0,
  share_count bigint not null default 0,
  theme text default 'neon',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists games_creator_idx on public.games(creator_id);
create index if not exists games_status_created_idx on public.games(status, created_at desc);

create table if not exists public.likes (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create table if not exists public.saves (
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, game_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists comments_game_idx on public.comments(game_id, created_at desc);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists views_game_idx on public.views(game_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_username text;
  final_username text;
begin
  base_username := lower(regexp_replace(split_part(coalesce(new.email, 'player'), '@', 1), '[^a-z0-9]', '', 'g'));
  if base_username is null or base_username = '' then
    base_username := 'player';
  end if;
  final_username := base_username || '_' || substr(replace(new.id::text, '-', ''), 1, 6);

  insert into public.profiles (id, username, display_name, avatar_url)
  values (
    new.id,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', initcap(base_username)),
    coalesce(new.raw_user_meta_data->>'avatar_url', null)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Counter helpers
create or replace function public.bump_like_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.games set like_count = like_count + 1 where id = new.game_id;
  elsif tg_op = 'DELETE' then
    update public.games set like_count = greatest(like_count - 1, 0) where id = old.game_id;
  end if;
  return null;
end;
$$;

drop trigger if exists likes_count_trg on public.likes;
create trigger likes_count_trg
  after insert or delete on public.likes
  for each row execute function public.bump_like_count();

create or replace function public.bump_save_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.games set save_count = save_count + 1 where id = new.game_id;
  elsif tg_op = 'DELETE' then
    update public.games set save_count = greatest(save_count - 1, 0) where id = old.game_id;
  end if;
  return null;
end;
$$;

drop trigger if exists saves_count_trg on public.saves;
create trigger saves_count_trg
  after insert or delete on public.saves
  for each row execute function public.bump_save_count();

create or replace function public.bump_comment_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.games set comment_count = comment_count + 1 where id = new.game_id;
  elsif tg_op = 'DELETE' then
    update public.games set comment_count = greatest(comment_count - 1, 0) where id = old.game_id;
  end if;
  return null;
end;
$$;

drop trigger if exists comments_count_trg on public.comments;
create trigger comments_count_trg
  after insert or delete on public.comments
  for each row execute function public.bump_comment_count();

create or replace function public.bump_follow_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update public.profiles set following_count = following_count + 1 where id = new.follower_id;
    update public.profiles set follower_count = follower_count + 1 where id = new.following_id;
  elsif tg_op = 'DELETE' then
    update public.profiles set following_count = greatest(following_count - 1, 0) where id = old.follower_id;
    update public.profiles set follower_count = greatest(follower_count - 1, 0) where id = old.following_id;
  end if;
  return null;
end;
$$;

drop trigger if exists follows_count_trg on public.follows;
create trigger follows_count_trg
  after insert or delete on public.follows
  for each row execute function public.bump_follow_counts();

create or replace function public.record_view(p_game_id uuid, p_user_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.views (game_id, user_id) values (p_game_id, p_user_id);
  update public.games set view_count = view_count + 1 where id = p_game_id;
end;
$$;

-- RLS
alter table public.profiles enable row level security;
alter table public.games enable row level security;
alter table public.likes enable row level security;
alter table public.saves enable row level security;
alter table public.comments enable row level security;
alter table public.follows enable row level security;
alter table public.views enable row level security;

-- Profiles policies
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Games policies
drop policy if exists "Published games are public" on public.games;
create policy "Published games are public" on public.games for select using (
  status = 'published' or creator_id = auth.uid()
);

drop policy if exists "Users can create games" on public.games;
create policy "Users can create games" on public.games for insert with check (auth.uid() = creator_id);

drop policy if exists "Users can update own games" on public.games;
create policy "Users can update own games" on public.games for update using (auth.uid() = creator_id);

drop policy if exists "Users can delete own games" on public.games;
create policy "Users can delete own games" on public.games for delete using (auth.uid() = creator_id);

-- Likes
drop policy if exists "Likes are viewable by everyone" on public.likes;
create policy "Likes are viewable by everyone" on public.likes for select using (true);
drop policy if exists "Users can like" on public.likes;
create policy "Users can like" on public.likes for insert with check (auth.uid() = user_id);
drop policy if exists "Users can unlike" on public.likes;
create policy "Users can unlike" on public.likes for delete using (auth.uid() = user_id);

-- Saves
drop policy if exists "Saves viewable by owner" on public.saves;
create policy "Saves viewable by owner" on public.saves for select using (auth.uid() = user_id);
drop policy if exists "Users can save" on public.saves;
create policy "Users can save" on public.saves for insert with check (auth.uid() = user_id);
drop policy if exists "Users can unsave" on public.saves;
create policy "Users can unsave" on public.saves for delete using (auth.uid() = user_id);

-- Comments
drop policy if exists "Comments are public" on public.comments;
create policy "Comments are public" on public.comments for select using (true);
drop policy if exists "Users can comment" on public.comments;
create policy "Users can comment" on public.comments for insert with check (auth.uid() = user_id);
drop policy if exists "Users can delete own comments" on public.comments;
create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);

-- Follows
drop policy if exists "Follows are public" on public.follows;
create policy "Follows are public" on public.follows for select using (true);
drop policy if exists "Users can follow" on public.follows;
create policy "Users can follow" on public.follows for insert with check (auth.uid() = follower_id);
drop policy if exists "Users can unfollow" on public.follows;
create policy "Users can unfollow" on public.follows for delete using (auth.uid() = follower_id);

-- Views
drop policy if exists "Anyone can insert views" on public.views;
create policy "Anyone can insert views" on public.views for insert with check (true);
drop policy if exists "Views readable by authenticated" on public.views;
create policy "Views readable by authenticated" on public.views for select using (auth.role() = 'authenticated');

grant usage on schema public to anon, authenticated;
grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;
grant select, insert, update, delete on public.games to authenticated;
grant select on public.games to anon;
grant select, insert, delete on public.likes to authenticated;
grant select on public.likes to anon;
grant select, insert, delete on public.saves to authenticated;
grant select, insert, delete on public.comments to authenticated;
grant select on public.comments to anon;
grant select, insert, delete on public.follows to authenticated;
grant select on public.follows to anon;
grant insert on public.views to anon, authenticated;
grant select on public.views to authenticated;
grant execute on function public.record_view(uuid, uuid) to anon, authenticated;
