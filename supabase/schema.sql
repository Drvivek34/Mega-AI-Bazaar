-- Mega AI Bazaar — Supabase schema for shared ratings + on-site submissions.
-- Run this in your Supabase project's SQL editor (one time).
-- Security model: anonymous visitors may INSERT ratings (1–5) and submissions,
-- and may READ only the aggregated averages — never raw submissions.

-- ---------- ratings ----------
create table if not exists public.ratings (
  id          bigint generated always as identity primary key,
  bazaar      text not null,
  item        text not null,
  rating      int  not null check (rating between 1 and 5),
  created_at  timestamptz not null default now()
);
alter table public.ratings enable row level security;

drop policy if exists "anon insert ratings" on public.ratings;
create policy "anon insert ratings" on public.ratings
  for insert to anon with check (rating between 1 and 5);

-- (no SELECT policy on the raw table — reads go through the aggregate view below)

-- ---------- aggregate view (public-readable) ----------
create or replace view public.rating_aggregates
  with (security_invoker = off) as
select bazaar,
       item,
       round(avg(rating)::numeric, 2) as avg,
       count(*)                       as count
from public.ratings
group by bazaar, item;

grant select on public.rating_aggregates to anon;

-- ---------- submissions ----------
create table if not exists public.submissions (
  id          bigint generated always as identity primary key,
  bazaar      text not null,
  name        text not null,
  category    text,
  source      text,
  author      text,
  note        text,
  created_at  timestamptz not null default now()
);
alter table public.submissions enable row level security;

drop policy if exists "anon insert submissions" on public.submissions;
create policy "anon insert submissions" on public.submissions
  for insert to anon with check (char_length(name) between 1 and 200);

-- (no SELECT policy => anonymous users cannot read submissions back;
--  review them in the Supabase dashboard / Table editor.)

-- Optional hardening to add later: a Postgres function / Edge Function for
-- rate-limiting or de-duplicating votes per device/IP.
