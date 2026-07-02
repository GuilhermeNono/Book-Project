-- Track Read — suporte a múltiplos livros lidos no mesmo dia (idempotente).
-- Rode este script no SQL Editor do Supabase, depois das migrações anteriores.

-- ---------------------------------------------------------------------------
-- reading_day_books — zero ou mais livros lidos em um dia (user_id, day) de
-- reading_days. book_id/book_title continuam sendo um "snapshot" (sem FK
-- para showcase_books), assim como já era em reading_days.book_id/book_title
-- (colunas que passam a ser vestigiais a partir desta migração).
-- ---------------------------------------------------------------------------
create table if not exists public.reading_day_books (
  user_id uuid not null,
  day date not null,
  book_id text not null,
  book_title text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, day, book_id),
  foreign key (user_id, day) references public.reading_days (user_id, day) on delete cascade
);

alter table public.reading_day_books enable row level security;

drop policy if exists "Users can view own reading day books" on public.reading_day_books;
create policy "Users can view own reading day books"
  on public.reading_day_books for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own reading day books" on public.reading_day_books;
create policy "Users can insert own reading day books"
  on public.reading_day_books for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reading day books" on public.reading_day_books;
create policy "Users can delete own reading day books"
  on public.reading_day_books for delete
  using (auth.uid() = user_id);

-- Backfill idempotente: migra o único livro por dia já salvo em reading_days
-- (colunas antigas) para a nova tabela, sem duplicar em reruns.
insert into public.reading_day_books (user_id, day, book_id, book_title)
select user_id, day, book_id, book_title
from public.reading_days
where book_id is not null and book_title is not null
on conflict (user_id, day, book_id) do nothing;
