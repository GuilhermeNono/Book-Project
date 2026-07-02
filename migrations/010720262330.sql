-- Track Read — funcionalidades sociais: amigos, chat, vitrine pública e
-- Read Match (idempotente). Rode este script no SQL Editor do Supabase,
-- depois das três migrações anteriores.

-- ---------------------------------------------------------------------------
-- friendships — uma única linha por par de usuários (par ordenado:
-- user_low < user_high), evitando duas linhas assimétricas para a mesma
-- amizade. status 'pending' -> 'accepted'; convites recusados ou amizades
-- desfeitas são DELETE (sem status 'declined').
-- ---------------------------------------------------------------------------
create table if not exists public.friendships (
  user_low uuid not null references auth.users (id) on delete cascade,
  user_high uuid not null references auth.users (id) on delete cascade,
  requested_by uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (user_low, user_high),
  check (user_low < user_high),
  check (requested_by = user_low or requested_by = user_high)
);

alter table public.friendships enable row level security;

drop policy if exists "Participants can view their friendship" on public.friendships;
create policy "Participants can view their friendship"
  on public.friendships for select
  using (auth.uid() = user_low or auth.uid() = user_high);

drop policy if exists "Requester can send friend request" on public.friendships;
create policy "Requester can send friend request"
  on public.friendships for insert
  with check (
    auth.uid() = requested_by
    and (auth.uid() = user_low or auth.uid() = user_high)
    and status = 'pending'
  );

drop policy if exists "Participants can update friendship" on public.friendships;
create policy "Participants can update friendship"
  on public.friendships for update
  using (auth.uid() = user_low or auth.uid() = user_high)
  with check (auth.uid() = user_low or auth.uid() = user_high);

drop policy if exists "Participants can delete friendship" on public.friendships;
create policy "Participants can delete friendship"
  on public.friendships for delete
  using (auth.uid() = user_low or auth.uid() = user_high);

-- Função auxiliar: "a e b são amigos com convite aceito?". security definer
-- porque é consultada a partir das policies de OUTRAS tabelas (reading_days,
-- reading_day_books, messages), que precisam verificar a amizade de um par
-- que pode não incluir diretamente auth.uid() = user_low/user_high na leitura
-- direta da tabela friendships dentro dessas policies.
create or replace function public.are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.friendships f
    where f.user_low = least(a, b)
      and f.user_high = greatest(a, b)
      and f.status = 'accepted'
  );
$$;

grant execute on function public.are_friends(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- messages — mensagens de texto entre amigos. Entrega em tempo real via
-- Supabase Realtime (postgres_changes), habilitado abaixo.
-- ---------------------------------------------------------------------------
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists messages_conversation_idx
  on public.messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at);

alter table public.messages enable row level security;

drop policy if exists "Friends can view their conversation" on public.messages;
create policy "Friends can view their conversation"
  on public.messages for select
  using (
    (auth.uid() = sender_id or auth.uid() = recipient_id)
    and public.are_friends(sender_id, recipient_id)
  );

drop policy if exists "Friends can send messages" on public.messages;
create policy "Friends can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id and public.are_friends(sender_id, recipient_id));

drop policy if exists "Recipient can mark message as read" on public.messages;
create policy "Recipient can mark message as read"
  on public.messages for update
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Habilita Realtime (postgres_changes) para a tabela messages. O comando
-- "alter publication ... add table" falha se a tabela já foi adicionada,
-- então o guard abaixo garante idempotência.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- profiles — leitura pública (busca de usuários por display_name). Aditiva à
-- policy "Users can view own profile" já existente (RLS combina policies da
-- mesma operação com OR). Sem colunas sensíveis em profiles, using(true) é
-- seguro; quem restringe as colunas retornadas é o select() do adaptador.
-- ---------------------------------------------------------------------------
drop policy if exists "Public can search basic profile info" on public.profiles;
create policy "Public can search basic profile info"
  on public.profiles for select
  using (true);

-- ---------------------------------------------------------------------------
-- reading_days / reading_day_books — leitura liberada para amigos aceitos,
-- usada pelo Read Match. Aditiva às policies "Users can view own..." já
-- existentes.
-- ---------------------------------------------------------------------------
drop policy if exists "Friends can view reading days for Read Match" on public.reading_days;
create policy "Friends can view reading days for Read Match"
  on public.reading_days for select
  using (public.are_friends(auth.uid(), user_id));

drop policy if exists "Friends can view reading day books for Read Match" on public.reading_day_books;
create policy "Friends can view reading day books for Read Match"
  on public.reading_day_books for select
  using (public.are_friends(auth.uid(), user_id));

-- ---------------------------------------------------------------------------
-- showcase_books — leitura pública (ver a vitrine de qualquer usuário, sem
-- precisar ser amigo). Diferente do Read Match: aqui é público mesmo.
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can view any users showcase" on public.showcase_books;
create policy "Anyone can view any users showcase"
  on public.showcase_books for select
  using (true);
