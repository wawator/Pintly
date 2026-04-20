-- Run this in Supabase SQL Editor

-- 1. Bars table
create table public.bars (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  city text,
  address text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.bars enable row level security;

create policy "Bars are publicly readable" on public.bars for select using (true);
create policy "Authenticated users can create bars" on public.bars for insert with check (auth.uid() = created_by);

create index bars_name_idx on public.bars using gin(to_tsvector('french', name));
create index bars_city_idx on public.bars(city);

-- 2. Add bar_id to sessions (nullable for backwards compatibility)
alter table public.sessions add column if not exists bar_id uuid references public.bars(id) on delete set null;
create index sessions_bar_id_idx on public.sessions(bar_id);
