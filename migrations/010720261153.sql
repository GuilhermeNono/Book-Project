-- Track Read — schema completo (idempotente: seguro rodar de novo).
-- Rode este script inteiro no SQL Editor do Supabase.

-- ---------------------------------------------------------------------------
-- reading_days — dias marcados como lidos, opcionalmente ligados a um livro
-- da vitrine (book_id/book_title são um "snapshot": sobrevivem se o livro for
-- removido da vitrine depois).
-- ---------------------------------------------------------------------------
create table if not exists public.reading_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day)
);

alter table public.reading_days add column if not exists book_id text;
alter table public.reading_days add column if not exists book_title text;

alter table public.reading_days enable row level security;

drop policy if exists "Users can view own reading days" on public.reading_days;
create policy "Users can view own reading days"
  on public.reading_days for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own reading days" on public.reading_days;
create policy "Users can insert own reading days"
  on public.reading_days for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reading days" on public.reading_days;
create policy "Users can delete own reading days"
  on public.reading_days for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- profiles — dados de perfil (nome de exibição + foto).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- showcase_books — "vitrine": livros que o usuário marcou como possuídos.
-- ---------------------------------------------------------------------------
create table if not exists public.showcase_books (
  user_id uuid not null references auth.users (id) on delete cascade,
  book_id text not null,
  title text not null,
  authors text,
  cover_url text,
  added_at timestamptz not null default now(),
  primary key (user_id, book_id)
);

alter table public.showcase_books enable row level security;

drop policy if exists "Users can view own showcase" on public.showcase_books;
create policy "Users can view own showcase"
  on public.showcase_books for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own showcase" on public.showcase_books;
create policy "Users can insert own showcase"
  on public.showcase_books for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own showcase" on public.showcase_books;
create policy "Users can delete own showcase"
  on public.showcase_books for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: bucket "avatars" (público para leitura; escrita restrita ao dono).
-- Avatares ficam em avatars/<user_id>/photo.jpg.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "Avatar images are publicly readable" on storage.objects;
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "Users can upload own avatar" on storage.objects;
create policy "Users can upload own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can update own avatar" on storage.objects;
create policy "Users can update own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users can delete own avatar" on storage.objects;
create policy "Users can delete own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
