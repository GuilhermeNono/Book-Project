-- Track Read — app_versions (idempotente: seguro rodar de novo).
-- Rode este script inteiro no SQL Editor do Supabase, depois de rodar
-- 010720261153.sql.

-- ---------------------------------------------------------------------------
-- app_versions — registra cada build de produção publicado pelo workflow de
-- CI (.github/workflows/eas-build.yml), para o app avisar o usuário quando
-- existir uma versão mais nova para baixar (o app não é distribuído pela
-- Play Store, então não há atualização automática do sistema).
--
-- Leitura é pública (o app consulta sem estar autenticado). Escrita não tem
-- policy nenhuma — só a service role key (usada exclusivamente pelo CI, fora
-- do app) pode inserir, já que ela ignora RLS.
-- ---------------------------------------------------------------------------
create table if not exists public.app_versions (
  id bigint generated always as identity primary key,
  version text not null,
  apk_url text not null,
  release_notes text,
  created_at timestamptz not null default now()
);

alter table public.app_versions enable row level security;

drop policy if exists "Anyone can read app versions" on public.app_versions;
create policy "Anyone can read app versions"
  on public.app_versions for select
  using (true);
