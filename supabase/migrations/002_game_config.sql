-- Optional: dedicated jsonb column for play configs.
-- Until applied, Kairos stores PlayConfig JSON in games.play_url.

alter table public.games
  add column if not exists game_config jsonb;

comment on column public.games.game_config is 'Playable mini-game config (genre, colors, speed).';
comment on column public.games.play_url is 'Legacy/URL or JSON PlayConfig string used by Kairos runtime.';
