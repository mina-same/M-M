-- Run this in the Supabase SQL Editor for the project used by .env.
-- It creates the guest wish table and the public image bucket required by the app.

create extension if not exists pgcrypto;

create table if not exists public.wish_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  message text not null,
  photo_urls text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.wish_messages enable row level security;

drop policy if exists "Anyone can submit wedding wishes" on public.wish_messages;
create policy "Anyone can submit wedding wishes"
on public.wish_messages
for insert
to anon, authenticated
with check (
  length(trim(name)) between 1 and 120
  and length(trim(message)) between 1 and 5000
  and cardinality(photo_urls) <= 4
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wish-images',
  'wish-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view wish images" on storage.objects;
create policy "Anyone can view wish images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'wish-images');

drop policy if exists "Anyone can upload wish images" on storage.objects;
create policy "Anyone can upload wish images"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'wish-images'
  and owner is null
  and lower((storage.foldername(name))[1]) = 'guest-wishes'
);
