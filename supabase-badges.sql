-- Run this in Supabase SQL Editor to add the badges system

create table public.user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id text not null,
  earned_at timestamptz default now(),
  unique(user_id, badge_id)
);

alter table public.user_badges enable row level security;

create policy "Badges are publicly readable" on public.user_badges for select using (true);
create policy "Server can insert badges" on public.user_badges for insert with check (auth.uid() = user_id);

create index user_badges_user_id_idx on public.user_badges(user_id);
