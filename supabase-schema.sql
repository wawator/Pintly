-- Pintly Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  full_name text,
  avatar_url text,
  bio text,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- SESSIONS
-- ============================================
create table public.sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  bar_name text not null,
  bar_location text,
  started_at timestamptz default now() not null,
  ended_at timestamptz,
  notes text,
  created_at timestamptz default now()
);

-- ============================================
-- DRINKS
-- ============================================
create table public.drinks (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  type text not null check (type in ('beer', 'wine', 'shot', 'cocktail', 'cider', 'other')),
  name text not null,
  started_at timestamptz default now() not null,
  finished_at timestamptz,
  volume_ml integer default 330
);

-- ============================================
-- CAPS (like Kudos on Strava)
-- ============================================
create table public.caps (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.sessions(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(session_id, user_id)
);

-- ============================================
-- FRIENDSHIPS
-- ============================================
create table public.friendships (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  status text not null check (status in ('pending', 'accepted')) default 'pending',
  created_at timestamptz default now(),
  unique(user_id, friend_id)
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
alter table public.profiles enable row level security;
alter table public.sessions enable row level security;
alter table public.drinks enable row level security;
alter table public.caps enable row level security;
alter table public.friendships enable row level security;

-- Profiles: public read, own write
create policy "Profiles are publicly readable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Sessions: public read, own write
create policy "Sessions are publicly readable" on public.sessions for select using (true);
create policy "Users can insert own sessions" on public.sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own sessions" on public.sessions for update using (auth.uid() = user_id);
create policy "Users can delete own sessions" on public.sessions for delete using (auth.uid() = user_id);

-- Drinks: public read, session owner write
create policy "Drinks are publicly readable" on public.drinks for select using (true);
create policy "Session owners can insert drinks" on public.drinks for insert with check (
  auth.uid() = (select user_id from public.sessions where id = session_id)
);
create policy "Session owners can update drinks" on public.drinks for update using (
  auth.uid() = (select user_id from public.sessions where id = session_id)
);

-- Caps: public read, authenticated users can cap
create policy "Caps are publicly readable" on public.caps for select using (true);
create policy "Authenticated users can give caps" on public.caps for insert with check (auth.uid() = user_id);
create policy "Users can remove own caps" on public.caps for delete using (auth.uid() = user_id);

-- Friendships: users can see their own
create policy "Users can see their friendships" on public.friendships for select using (
  auth.uid() = user_id or auth.uid() = friend_id
);
create policy "Users can send friend requests" on public.friendships for insert with check (auth.uid() = user_id);
create policy "Users can accept/update friendships" on public.friendships for update using (
  auth.uid() = user_id or auth.uid() = friend_id
);
create policy "Users can delete their friendships" on public.friendships for delete using (
  auth.uid() = user_id or auth.uid() = friend_id
);

-- ============================================
-- INDEXES
-- ============================================
create index sessions_user_id_idx on public.sessions(user_id);
create index sessions_started_at_idx on public.sessions(started_at desc);
create index drinks_session_id_idx on public.drinks(session_id);
create index caps_session_id_idx on public.caps(session_id);
create index friendships_user_id_idx on public.friendships(user_id);
create index friendships_friend_id_idx on public.friendships(friend_id);
