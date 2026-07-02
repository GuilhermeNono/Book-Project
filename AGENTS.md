# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

---

# Track Read — Overview do Projeto (para Agentes)

> Este documento é direcionado a **agentes de IA** que vão trabalhar neste repositório.
> Leia-o inteiro antes de modificar qualquer código. Ele descreve o quê o app faz,
> como a arquitetura está organizada, quais invariantes NÃO podem ser quebradas e
> onde cada tipo de mudança deve ser feita.

> ## ⚠️ CLÁUSULA IMPORTANTE — Manutenção obrigatória deste documento
>
> **A cada nova funcionalidade, mudança de arquitetura ou alteração de
> comportamento incluída no projeto, a IA responsável pela implementação DEVE
> atualizar as seções pertinentes deste `AGENTS.md` no mesmo turno em que o
> código é entregue.** Não é opcional e não deve ser adiado para um pedido
> separado do usuário.
>
> Isso inclui, conforme o que a mudança tocar:
> - Adicionar a funcionalidade na tabela/lista da seção 1 ("Funcionalidades").
> - Atualizar os diagramas Mermaid (arquitetura, ER, fluxos de sequência) que
>   passem a estar desatualizados ou incompletos.
> - Documentar novas entidades, ports, casos de uso, repositórios,
>   stores/componentes na seção 4 e no mapa de arquivos (seção 9).
> - Registrar novas tabelas/colunas/migrações na seção 5.
> - Acrescentar novas invariantes e gotchas nas seções 10/finais, se a mudança
>   criar uma regra que não pode ser quebrada ou uma armadilha não óbvia.
> - Atualizar variáveis de ambiente, secrets de CI e comandos, se a mudança
>   afetar configuração/build/CI-CD (seção 8).
>
> Este documento existe para que qualquer agente futuro — sem o contexto desta
> conversa — entenda o projeto real, não uma versão desatualizada dele. Deixar
> o `AGENTS.md` divergente do código após uma implementação é considerado uma
> tarefa incompleta.

## 1. Identidade do projeto

| Item | Valor |
| --- | --- |
| Nome do app | **Track Read** (slug: `Book-Project`) |
| Propósito | Rastreador de hábito de leitura diária — estilo "contribution graph" do GitHub, mas para livros |
| Plataformas | Android (foco principal — builds EAS geram APK), iOS e Web (suportados via Expo, sem builds no CI) |
| Framework | Expo SDK **57** (`~57.0.1`) · React Native **0.86** · React **19.2.3** |
| Linguagem | TypeScript `~6.0.3`, `strict: true` (extende `expo/tsconfig.base`) |
| Estado | Zustand `^5` (stores em `src/presentation/store/`) |
| Navegação | React Navigation `^7` — bottom tabs apenas (sem stack navigator) |
| Backend | Supabase (Auth + Postgres + Storage + Realtime) — chave *publishable*, RLS obrigatório |
| Catálogo de livros | Google Books API (REST, `fetch` direto) |
| Entry point | `index.ts` → `registerRootComponent(App)` → `App.tsx` |
| Package Android | `com.guilhermenono.bookproject` |
| Idioma do código | Comentários, mensagens de erro e strings de UI em **português (pt-BR)** |
| Commits | Conventional Commits em português (`feat:`, `fix:`, `chore:`...) |
| Testes | **Não existem testes no projeto** (nenhum runner configurado) |
| Lint/Format | **Não há ESLint/Prettier configurados** — siga o estilo dos arquivos existentes |

### Funcionalidades (visão de produto)

1. **Leitura (HomeScreen)** — botão "segure para confirmar" (1,5s de hold, constante
   `HOLD_DURATION_MS` em `ReadButton.tsx`); painel de estatísticas (streak atual,
   recorde, total, mês); calendário mensal interativo (toque em dia passado para
   corrigir). Regra de negócio central: **não se marca leitura em data futura**.
2. **Vitrine (ShowcaseScreen)** — busca na Google Books API com debounce de 400ms
   (`SEARCH_DEBOUNCE_MS`); adiciona/remove livros da vitrine pessoal. Ao marcar a
   leitura de hoje, se a vitrine não estiver vazia, um modal (`BookPickerModal`)
   permite selecionar **múltiplos** livros lidos naquele dia (ou nenhum) —
   salvos em `reading_day_books`, ligados ao dia em `reading_days`.
3. **Perfil (ProfileScreen)** — avatar via `expo-image-picker` (upload para o bucket
   `avatars` do Supabase Storage), nome de exibição editável, logout.
4. **Auth (LoginScreen)** — email/senha via Supabase Auth; o projeto Supabase exige
   **confirmação de email** antes do primeiro login (o `signUp` lança erro instrutivo
   quando `data.session` vem nulo). Sessão persistida em AsyncStorage.
5. **Aviso de atualização (`UpdateModal`)** — o app **não é distribuído pela Play
   Store** (APK sideload via EAS), então não há atualização automática do sistema.
   No boot, `useUpdateStore.check()` compara a versão instalada
   (`expo-constants` → `Constants.expoConfig.version`) com a última publicada na
   tabela `app_versions` do Supabase; se houver uma mais nova, mostra um pop-up
   **dispensável** com "Baixar atualização" (abre a URL do APK via `Linking`) e
   "Agora não". Ver seção 11 para o fluxo completo.
6. **Comunidade (`CommunityScreen`, aba "Comunidade")** — sistema de amigos
   (buscar por nome de exibição, enviar convite, aceitar/recusar, desfazer
   amizade), chat de texto em tempo real entre amigos (Supabase Realtime),
   vitrine pública de **qualquer** usuário (mesmo sem amizade) e "Read
   Match": comparação da atividade de leitura dos últimos 3 meses entre você
   e um amigo aceito (streaks, total de dias lidos, distribuição mensal,
   sobreposição de vitrine). Ver seção 12 para o fluxo completo.

## 2. Arquitetura — Clean Architecture em 4 camadas

O código em `src/` segue Clean Architecture com inversão de dependência estrita.
**A regra de ouro do projeto**: nenhum componente/tela de UI importa `container`,
implementações concretas de infraestrutura ou entidades para lógica — a UI fala
apenas com as **stores Zustand**, que por sua vez chamam **casos de uso** via o
composition root (`src/infrastructure/di/container.ts`).

```mermaid
graph TB
    subgraph presentation ["presentation/ (React Native)"]
        SCREENS["screens/<br/>HomeScreen · ShowcaseScreen<br/>ProfileScreen · LoginScreen · CommunityScreen"]
        COMPONENTS["components/<br/>ReadButton · MonthCalendar · StatsCard<br/>BookPickerModal · ShowcaseGrid<br/>PublicShowcaseView · ChatModal · ReadMatchModal"]
        STORES["store/ (Zustand)<br/>useAuthStore · useReadingStore · useShowcaseStore<br/>useProfileStore · useFriendsStore · useChatStore<br/>useCommunityStore · useReadMatchStore"]
        NAV["navigation/RootTabs.tsx"]
        THEME["theme/theme.ts (design tokens)"]
    end

    subgraph application ["application/use-cases/"]
        UC_READ["GetReadingLog · ToggleReadingDay · SearchBooks"]
        UC_AUTH["auth/: SignIn · SignUp · SignOut"]
        UC_SHOW["showcase/: GetShowcase · AddToShowcase · RemoveFromShowcase"]
        UC_PROF["profile/: GetProfile · UpdateAvatar · UpdateDisplayName"]
        UC_VER["CheckForUpdate"]
        UC_FRIENDS["friends/: GetFriends · SendFriendRequest<br/>AcceptFriendRequest · DeclineFriendRequest<br/>RemoveFriend · GetPendingRequestsCount"]
        UC_CHAT["chat/: GetConversation · SendMessage · MarkConversationRead"]
        UC_COMMUNITY["community/: SearchUsers · GetPublicShowcase"]
        UC_READMATCH["readmatch/: CompareReadingActivity"]
    end

    subgraph domain ["domain/ (zero dependência externa)"]
        ENTITIES["entities/<br/>ReadingLog (Aggregate Root) · Book · Profile<br/>Session · AppVersion · Friendship · Message · PublicProfile"]
        VO["value-objects/CalendarDate"]
        SERVICES["services/<br/>ReadingStatsCalculator · ReadingStats · VersionComparator<br/>FriendshipHelpers · ReadMatchCalculator · ReadMatch"]
        PORTS["repositories/ (interfaces)<br/>IReadingRepository · IAuthRepository · IBookCatalogRepository<br/>IShowcaseRepository · IProfileRepository · IAppVersionRepository<br/>IFriendshipRepository · IMessageRepository<br/>IPublicProfileRepository · IReadMatchRepository"]
    end

    subgraph infrastructure ["infrastructure/ (adaptadores concretos)"]
        DI["di/container.ts<br/>(Composition Root)"]
        SUPA["supabase/client.ts (client único)"]
        REPOS["SupabaseAuthRepository · SupabaseReadingRepository<br/>SupabaseShowcaseRepository · SupabaseProfileRepository<br/>SupabaseAppVersionRepository · SupabaseFriendshipRepository<br/>SupabaseMessageRepository · SupabasePublicProfileRepository<br/>SupabaseReadMatchRepository"]
        GOOGLE["catalog/GoogleBooksCatalogRepository"]
    end

    SCREENS --> STORES
    COMPONENTS --> STORES
    STORES --> DI
    DI --> UC_READ & UC_AUTH & UC_SHOW & UC_PROF & UC_VER & UC_FRIENDS & UC_CHAT & UC_COMMUNITY & UC_READMATCH
    UC_READ & UC_AUTH & UC_SHOW & UC_PROF & UC_VER & UC_FRIENDS & UC_CHAT & UC_COMMUNITY & UC_READMATCH --> PORTS
    PORTS -.implementadas por.-> REPOS
    PORTS -.implementadas por.-> GOOGLE
    REPOS --> SUPA
    UC_READ --> ENTITIES & VO
    UC_VER --> SERVICES
    UC_READMATCH --> SERVICES
    STORES --> SERVICES
    ENTITIES --> VO
```

**Direção das dependências**: `presentation → application → domain ← infrastructure`.
O domínio não importa nada de fora dele. A infraestrutura implementa as interfaces
(ports) declaradas em `domain/repositories/`. O único lugar onde concreto encontra
abstrato é `container.ts`.

### Exceções conhecidas à regra (não "corrija" sem pedido explícito)

- As **stores** importam `container` e tipos do domínio (`ReadingLog`, `Book`,
  `CalendarDate`, `ReadingStatsCalculator`) — isso é intencional: a store é a
  fronteira entre React e os casos de uso.
- `HomeScreen` importa o **tipo** `Book` do domínio (uso apenas de tipagem).
- `useAuthStore` acessa `container.authRepository` diretamente (para `getSession`
  e `onSessionChange`) em vez de passar por um caso de uso.
- `useChatStore` acessa `container.messageRepository` diretamente (para
  `subscribeToConversation`, o canal Realtime) — mesma exceção de
  `authRepository`, pelo mesmo motivo (é uma assinatura/listener, não uma
  operação única que caiba em um `execute()`).

## 3. Fluxo principal: marcar a leitura de hoje

Este é o caminho crítico do app. Qualquer mudança aqui exige atenção às invariantes.

```mermaid
sequenceDiagram
    actor U as Usuário
    participant RB as ReadButton
    participant HS as HomeScreen
    participant BPM as BookPickerModal
    participant ST as useReadingStore
    participant UC as ToggleReadingDay
    participant AGG as ReadingLog (domínio)
    participant REPO as SupabaseReadingRepository
    participant DB as Supabase (reading_days + reading_day_books)

    U->>RB: segura o botão por 1,5s
    RB->>HS: onConfirm()
    alt já leu hoje OU vitrine vazia
        HS->>ST: toggleToday()
    else vitrine tem livros
        HS->>BPM: abre modal
        U->>BPM: escolhe livro (ou "sem livro")
        BPM->>ST: toggleToday({bookId, bookTitle})
    end
    ST->>UC: execute(CalendarDate.today(), entry)
    UC->>REPO: load()
    REPO->>DB: select day (reading_days) + select day,book_id,book_title (reading_day_books), em paralelo
    DB-->>REPO: linhas das duas tabelas
    REPO-->>UC: ReadingLog.fromEntries(...)  [guarda lastLoaded]
    UC->>AGG: log.toggle(date, entry)
    Note over AGG: lança Error se date.isFuture()
    UC->>REPO: save(log)
    REPO->>DB: INSERT/DELETE em reading_days (diff vs lastLoaded) + INSERT dos livros do dia em reading_day_books (cascade no DELETE)
    UC-->>ST: ReadingLog atualizado
    ST->>ST: project(log) → markedDates[] + ReadingStatsCalculator.compute(log)
    ST-->>HS: re-render (stats, calendário)
```

Pontos de atenção neste fluxo:

- `SupabaseReadingRepository.save()` é **diff-based**: compara com o `Set`
  `lastLoaded` capturado no último `load()` e envia só inserts/deletes. `save()`
  sem um `load()` anterior na mesma instância se comporta como "inserir tudo".
  O caso de uso sempre faz `load()` antes de `save()` — mantenha esse contrato.
- `ReadingLog.toggle()` retorna `true/false` (marcou/desmarcou) e **lança** para
  data futura. O erro é capturado na store e vira `error: string` no estado.
- `toggleDate(iso)` (toque no calendário) não passa livro — só `toggleToday` liga
  a leitura a um livro da vitrine.

## 4. Domínio em detalhe

### `CalendarDate` (value object) — `src/domain/value-objects/CalendarDate.ts`
- Imutável; internamente uma string `YYYY-MM-DD` validada por regex.
- Representa um **dia civil local**, sem hora/timezone — comparações são string
  compare (`isFuture()` usa `this.value > today.toISO()`).
- `toDate()` ancora ao **meio-dia local** para evitar saltos de fuso.
- Fábricas: `fromISO`, `fromDate`, `today`. Operações: `addDays`, `previousDay`,
  `isToday`, `isSameMonth`, `equals`.
- **Nunca use `new Date().toISOString().slice(0,10)`** para obter "hoje" — isso
  usa UTC e quebra o conceito de dia civil local. Use `CalendarDate.today()`.

### `ReadingLog` (aggregate root) — `src/domain/entities/ReadingLog.ts`
- Encapsula um `Map<string /*ISO*/, ReadingEntry>` privado. `ReadingEntry` =
  `{ books: BookRef[] }` — **zero ou mais** livros por dia (`BookRef = { bookId,
  bookTitle }`), não um único livro. Persistido em `reading_day_books`
  (`(user_id, day, book_id)`), ligado a `reading_days` por `(user_id, day)`.
- Invariantes: sem datas duplicadas (garantido pelo Map), datas sempre válidas
  (normalizadas via `CalendarDate.fromISO`), **sem marcação em data futura**
  (validado em `toggle`; `mark` direto não valida — use `toggle` em fluxos de UI).
- Serialização para persistência: `toISOList()` (só datas, ordenadas) e
  `toEntryList()` (datas + livros). Reconstrução: `fromEntries` / `fromISOList`.
  `mostRecentBooks()` retorna os livros do dia marcado mais recente que tem
  algum livro associado.

### `ReadingStatsCalculator` (domain service)
- Funções estáticas puras: `currentStreak` (se hoje não foi marcado, o streak é
  medido a partir de **ontem** — o dia continua "vivo" até meia-noite),
  `longestStreak`, `countInMonth`, e `compute` que monta o read model
  `ReadingStats { total, currentStreak, longestStreak, thisMonth, readToday }`.

### `VersionComparator` (domain service)
- Função estática pura `isNewer(remote, local)`: compara duas strings semver
  simplificadas (`x.y.z`) numericamente por posição. Ausência de parte ou parte
  não numérica é tratada como `0`. Usada por `CheckForUpdate`.

### `Friendship` + `FriendshipHelpers` — `src/domain/entities/Friendship.ts` / `src/domain/services/FriendshipHelpers.ts`
- `Friendship { userLow, userHigh, requestedBy, status: 'pending' | 'accepted', createdAt }`
  — representa o par ordenado (`userLow < userHigh`) da tabela `friendships`,
  uma única linha por amizade (não duas linhas assimétricas).
- `FriendshipHelpers` (funções estáticas puras, sem aggregate próprio):
  `sortedPair(a, b)` (ordena o par antes de qualquer insert/query),
  `otherUser(friendship, selfUserId)` (retorna o outro participante, lança se
  `selfUserId` não participar), `isRequester(friendship, userId)`.
- Convites recusados ou amizades desfeitas são **DELETE** da linha, não um
  terceiro status — não existe `status: 'declined'`.

### `Message` — `src/domain/entities/Message.ts`
- `Message { id: number, senderId, recipientId, body, createdAt, readAt: string | null }`
  — mensagem de texto entre dois amigos, tabela `messages`. Entrega em tempo
  real via Supabase Realtime (`postgres_changes`), não polling.

### `PublicProfile` — `src/domain/entities/PublicProfile.ts`
- `PublicProfile { userId, displayName: string | null, avatarUrl: string | null }`
  — perfil de **outro** usuário (resultado de busca, membro da lista de
  amigos). Deliberadamente separado de `Profile`: nunca deve ser passado para
  `UpdateAvatar`/`UpdateDisplayName` (casos de uso self-only).

### `ReadMatch` + `ReadMatchCalculator` (domain service) — `src/domain/services/ReadMatch.ts` / `ReadMatchCalculator.ts`
- Read model `ReadMatch { self: ReadingStats, friend: ReadingStats, monthly: MonthBreakdown[], showcaseOverlapCount, daysBothRead, leader: {...} }`
  — resultado da comparação "Read Match" entre o usuário atual e um amigo.
- `ReadMatchCalculator` reaproveita `ReadingStatsCalculator`/`ReadingLog` sem
  reimplementar streak/total: `windowStart(today)` calcula o primeiro dia do
  mês que é 2 meses antes do mês atual (janela de **3 meses civis**, não 90
  dias corridos); `last3MonthsWindow(log, today)` recorta um `ReadingLog`
  completo para essa janela; `compute(selfLog, friendLog, selfShowcase,
  friendShowcase, today?)` monta o `ReadMatch` completo, incluindo `leader`
  (quem está na frente em cada indicador: `'self' | 'friend' | 'tie'`).

### Entidades simples (interfaces, não classes)
- `Book { id, title, authors: string[], coverUrl: string | null }`
- `Profile { userId, displayName: string | null, avatarUrl: string | null }`
- `Session { userId, email: string | null }` — deliberadamente mínima.
- `AppVersion { version, apkUrl, releaseNotes: string | null }` — versão mais
  recente publicada, lida da tabela `app_versions`.

## 5. Banco de dados (Supabase / Postgres)

Schema em quatro migrações idempotentes, nesta ordem:
[`migrations/010720261153.sql`](migrations/010720261153.sql) (schema principal),
[`migrations/010720261530.sql`](migrations/010720261530.sql) (`app_versions`),
[`migrations/010720262200.sql`](migrations/010720262200.sql) (`reading_day_books`
— múltiplos livros por dia) e
[`migrations/010720262330.sql`](migrations/010720262330.sql) (funcionalidades
sociais: `friendships`, `messages`, `are_friends()`, Realtime, policies
públicas em `profiles`/`showcase_books`, policies de amigos em
`reading_days`/`reading_day_books`) — rode todas em ordem no SQL Editor do
Supabase (não há CLI de migração configurada; nome do arquivo é o timestamp
`DDMMYYYYHHMM`). **Toda tabela tem RLS habilitado**; `reading_days`/
`reading_day_books`/`showcase_books` usam `auth.uid() = user_id` para
select/insert/delete própria, `profiles` usa update em vez de delete,
`app_versions` só tem policy de **select público** (`using (true)`) — não há
policy de insert/update/delete porque só a *secret key* do CI escreve nela, e
essa key ignora RLS. As tabelas sociais adicionam policies **aditivas** de
select público (`profiles`, `showcase_books`, `using (true)`) ou escopadas a
amizade aceita (`reading_days`/`reading_day_books`, via `are_friends()`) —
RLS combina policies da mesma operação com OR, então as policies antigas
continuam valendo.

```mermaid
erDiagram
    auth_users {
        uuid id PK
    }
    reading_days {
        uuid user_id PK,FK
        date day PK
        text book_id "vestigial — nullable, ver reading_day_books"
        text book_title "vestigial — nullable, ver reading_day_books"
        timestamptz created_at
    }
    reading_day_books {
        uuid user_id PK,FK
        date day PK
        text book_id PK "snapshot — sem FK para showcase_books"
        text book_title
        timestamptz created_at
    }
    profiles {
        uuid user_id PK,FK
        text display_name "nullable"
        text avatar_url "nullable"
        timestamptz updated_at
    }
    showcase_books {
        uuid user_id PK,FK
        text book_id PK "id do Google Books"
        text title
        text authors "nullable — string 'a, b, c'"
        text cover_url "nullable"
        timestamptz added_at
    }
    storage_avatars {
        text path "avatars/(user_id)/photo.jpg"
    }
    app_versions {
        bigint id PK "identity"
        text version "ex.: 1.2.0"
        text apk_url
        text release_notes "nullable"
        timestamptz created_at
    }
    friendships {
        uuid user_low PK,FK "par ordenado: user_low < user_high"
        uuid user_high PK,FK
        uuid requested_by FK
        text status "'pending' | 'accepted'"
        timestamptz created_at
        timestamptz responded_at "nullable"
    }
    messages {
        bigint id PK "identity"
        uuid sender_id FK
        uuid recipient_id FK
        text body
        timestamptz created_at
        timestamptz read_at "nullable"
    }

    auth_users ||--o{ reading_days : "on delete cascade"
    reading_days ||--o{ reading_day_books : "on delete cascade, via (user_id, day)"
    auth_users ||--o| profiles : "on delete cascade"
    auth_users ||--o{ showcase_books : "on delete cascade"
    auth_users ||--o| storage_avatars : "escrita restrita ao dono"
    auth_users ||--o{ friendships : "on delete cascade (user_low/user_high/requested_by)"
    auth_users ||--o{ messages : "on delete cascade (sender_id/recipient_id)"
```

> `app_versions` não tem relação com `auth_users` — é uma tabela global (uma
> linha por build publicado), não escopada por usuário.
> `reading_days.book_id`/`book_title` são vestigiais desde a migração
> `010720262200.sql` — os livros do dia vivem em `reading_day_books`.

Decisões de modelagem que agentes precisam respeitar:

- `reading_days.book_id`/`book_title` são um **snapshot desnormalizado**: se o
  livro sair da vitrine depois, o registro do dia mantém o título. Não crie FK
  para `showcase_books`.
- `showcase_books.authors` é uma **string única** juntada com `', '`
  (`SupabaseShowcaseRepository` faz join/split). Não mude para array sem migrar
  os dados e o adaptador juntos.
- Bucket `avatars` é **público para leitura**; escrita/update/delete exigem que a
  primeira pasta do path seja o `auth.uid()` do usuário. O path é fixo:
  `<user_id>/photo.jpg` (upsert). A URL pública recebe `?updated=<timestamp>`
  para cache-busting — preserve isso ao mexer em `updateAvatar`.
- Nenhuma linha de `profiles` é criada no signup — `load()` usa `maybeSingle()` e
  devolve campos nulos; a primeira escrita é um `upsert`.
- `app_versions` acumula uma linha por build (não é upsert) — "a mais recente"
  é sempre `order by created_at desc limit 1`. Não crie constraint de unicidade
  em `version`; builds re-executados manualmente no mesmo dia podem duplicar,
  o que é inofensivo (o `order by created_at` resolve o desempate).
- `reading_day_books` guarda **zero ou mais** livros por dia (chave
  `(user_id, day, book_id)`, FK composta para `(user_id, day)` de
  `reading_days` com `on delete cascade`), substituindo o antigo modelo de um
  único livro por dia. `book_id`/`book_title` continuam sendo um snapshot
  desnormalizado (sem FK para `showcase_books`), mesma lógica de antes.
- `friendships` é modelada como **par ordenado** (`user_low < user_high`,
  `check` na tabela) com **uma única linha por amizade**, em vez de duas
  linhas assimétricas (uma por direção). Isso torna "X e Y são amigos?" uma
  consulta de uma linha só e evita o caso de só uma das duas linhas ser
  atualizada/existir. Toda leitura/escrita por par deve ordenar os dois
  `userId`s antes (`FriendshipHelpers.sortedPair`) — nunca monte a chave
  primária sem passar por esse helper.
- A função `public.are_friends(a, b)` (SQL, `security definer`) centraliza a
  checagem "amizade aceita entre a e b" e é reutilizada pelas policies de
  `messages`, `reading_days` e `reading_day_books` — não duplique essa
  subquery em novas policies, chame a função.
- Convites de amizade recusados ou amizades desfeitas são **DELETE** da linha
  em `friendships`, não um status `'declined'` — não há cooldown para
  reenviar um convite depois de recusado.

## 6. Autenticação e ciclo de vida da sessão

```mermaid
flowchart TD
    START([App abre]) --> SPLASH["SplashScreen.preventAutoHideAsync()"]
    SPLASH --> INIT["useAuthStore.init()<br/>authRepository.getSession()"]
    INIT --> DECIDE{initialized?}
    DECIDE -- "não" --> NULLRENDER["render null (splash nativa segue visível)"]
    DECIDE -- "sim, sem sessão" --> LOGIN[LoginScreen]
    DECIDE -- "sim, com sessão" --> TABS["NavigationContainer > RootTabs"]
    LOGIN -- "signIn/signUp ok" --> TABS
    TABS -- "signOut" --> LOGIN

    subgraph listener ["onAuthStateChange (registrado na criação da store)"]
        EVT[evento de sessão] --> CHANGED{userId mudou?}
        CHANGED -- "sim (troca de usuário/logout)" --> RESET["reset() em useReadingStore, useShowcaseStore,<br/>useProfileStore, useFriendsStore, useChatStore,<br/>useCommunityStore, useReadMatchStore"]
        CHANGED -- não --> SETONLY["set({ session })"]
        RESET --> SETONLY
    end
```

- O client Supabase (`src/infrastructure/supabase/client.ts`) é **singleton**, usa
  AsyncStorage para persistir sessão, `autoRefreshToken: true`,
  `detectSessionInUrl: false`. Ele **lança na importação** se as env vars não
  estiverem definidas — qualquer código que importe a árvore de infraestrutura
  sem `.env` configurado quebra imediatamente (inclusive scripts/testes futuros).
- Usa a **Publishable key** (`sb_publishable_...`), nunca a Secret key. A Secret
  key ignora RLS e jamais deve aparecer neste repositório.
- Toda store de dados tem `reset()`; se você criar uma nova store com dados por
  usuário, **registre o reset dela no listener do `useAuthStore`** para não vazar
  dados entre contas.

## 7. Camada de apresentação — padrões

- **Stores Zustand** seguem o mesmo shape: estado (`loading`, `initialized`,
  `error: string | null`, dados) + ações assíncronas que capturam exceções e as
  transformam em `error` legível (mensagens em pt-BR). Siga esse formato.
- `useReadingStore` mantém uma **projeção** da UI (`markedDates: string[]` +
  `stats`), nunca o `ReadingLog` em si — a entidade é recalculada/projetada a
  cada operação via helper `project(log)`.
- **Telas** chamam `init()` da store em `useEffect` e renderizam
  `ActivityIndicator` enquanto `!initialized`. `HomeScreen` também inicializa a
  vitrine (precisa dela para o `BookPickerModal`).
- **Tema**: todos os estilos usam os design tokens de
  `src/presentation/theme/theme.ts` (dark theme fixo, `userInterfaceStyle: light`
  no `app.json` refere-se ao chrome nativo). **Não hardcode cores/espaçamentos** —
  adicione tokens se precisar. Cores base: background `#0F1115`, surface
  `#1A1D24`, primary `#6C8CFF`, accent `#FFB86C`.
- Animações usam a **Animated API do React Native core** (não Reanimated — não
  está instalado).
- Navegação: apenas `createBottomTabNavigator` com rotas `Leitura`, `Vitrine`,
  `Comunidade`, `Perfil` (tipadas em `RootTabParamList`). Ícones: Ionicons via
  `@expo/vector-icons`. Não há stack — modais são `Modal`/estado local. A aba
  `Comunidade` usa `tabBarBadge` para o contador de pedidos de amizade
  pendentes (`useFriendsStore().pendingCount`); as subtelas sociais (chat,
  vitrine pública, Read Match) são `Modal`s abertos a partir de estado local
  em `CommunityScreen`, não rotas novas — mantém a invariante "sem stack".

## 8. Configuração, build e CI/CD

### Variáveis de ambiente (`.env`, exemplo em `.env.example`)

| Variável | Uso |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | URL do projeto Supabase (obrigatória) |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (obrigatória) |
| `EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY` | Opcional; sem ela a busca usa a cota anônima compartilhada do Google (esgota rápido) |

⚠️ Variáveis `EXPO_PUBLIC_*` são **embutidas no bundle em build-time**. Depois de
editar o `.env`, reinicie com `npx expo start -c`. Elas **não são secretas** no
app final — por isso só a publishable key é usada.

### Pipeline

```mermaid
flowchart LR
    DEV[dev local<br/>npm start / expo start] --> PUSH[push na branch master]
    PUSH --> GHA[".github/workflows/eas-build.yml<br/>(GitHub Actions, também via workflow_dispatch)"]
    GHA --> STEPS["checkout → Node 24 + cache npm →<br/>expo-github-action (EXPO_TOKEN secret) → npm ci"]
    STEPS --> EAS["eas build --platform android<br/>--profile production --non-interactive --json<br/>(aguarda o build terminar)"]
    EAS --> PARSE["jq extrai artifacts.buildUrl<br/>e appVersion do JSON"]
    PARSE --> PUBLISH["curl POST .../rest/v1/app_versions<br/>(secret key)"]
    PARSE --> APK["APK Android (distribution: internal,<br/>autoIncrement de versão, appVersionSource: remote)"]
    PUBLISH --> DB[("tabela app_versions<br/>(Supabase)")]
    DB -.consultada no boot por.-> APP["useUpdateStore.check()<br/>no app instalado"]
```

- **Todo push em `master` dispara um build EAS de produção** (Android APK). O
  workflow **espera o build terminar** (`--json`, sem `--no-wait`) para poder ler
  a URL do artefato e publicá-la.
- Depois do build, o workflow extrai `artifacts.buildUrl` e `appVersion` do JSON
  retornado pelo `eas build` e grava uma linha nova em `app_versions` via REST
  do PostgREST, autenticado com a **Secret key** do Supabase (par server-side do
  sistema novo de API keys — mesma família da `sb_publishable_...` usada no
  app, mas com prefixo `sb_secret_...` e que ignora RLS; substitui a antiga
  `service_role` key legada). Se `buildUrl` vier vazio/nulo, o step falha
  explicitamente em vez de publicar uma versão sem APK.
- Perfis EAS (`eas.json`): `preview` e `production`, ambos APK interno. iOS não é
  buildado no CI de propósito (commit "Restringindo Build apenas para android").
- EAS project ID: `4a97149b-3980-4d94-b063-370ecc76714b` (em `app.json > extra.eas`).
- Secrets necessários no GitHub (Settings → Secrets and variables → Actions):
  - `EXPO_TOKEN` — já existia, autentica o `eas build`.
  - `SUPABASE_URL` — URL do projeto (mesmo valor de `EXPO_PUBLIC_SUPABASE_URL`,
    mas como secret separado porque é usado em `curl`, fora do bundle do app).
  - `SUPABASE_SECRET_KEY` — a **Secret key** (`sb_secret_...`) do projeto, em
    Project Settings → API Keys no painel do Supabase. **Nunca** deve ir para
    `.env`/`.env.example` nem para o bundle do app; existe só neste secret do CI.

### Comandos úteis

```bash
npm install        # instalar dependências
npm start          # Metro / Expo Go
npm run android    # dev build Android
npx expo start -c  # limpar cache (obrigatório após mudar .env)
npx tsc --noEmit   # única "verificação" disponível (não há testes/lint)
```

## 9. Mapa de arquivos (fora de node_modules)

```
Book-Project/
├── App.tsx                     # Root: splash, decide LoginScreen vs RootTabs pela sessão
├── index.ts                    # registerRootComponent(App)
├── app.json                    # Config Expo: ícones, splash, plugin image-picker, package Android
├── eas.json                    # Perfis de build EAS (preview/production, APK)
├── package.json                # Deps — sem lint, sem testes, scripts só de start
├── tsconfig.json               # strict, extende expo/tsconfig.base
├── .env / .env.example         # EXPO_PUBLIC_* (Supabase + Google Books)
├── migrations/
│   ├── 010720261153.sql        # Schema principal idempotente (tabelas + RLS + bucket avatars)
│   ├── 010720261530.sql        # app_versions (idempotente) — rode depois do schema principal
│   ├── 010720262200.sql        # reading_day_books (múltiplos livros por dia) — rode depois de app_versions
│   └── 010720262330.sql        # friendships, messages, are_friends(), Realtime, policies sociais
├── .github/workflows/
│   └── eas-build.yml           # push master → EAS build Android production → publica versão no Supabase
├── assets/                     # Ícones, splash, adaptive icons Android
└── src/
    ├── domain/
    │   ├── entities/           # ReadingLog (classe/aggregate), Book, Profile, Session, AppVersion,
    │   │                       # Friendship, Message, PublicProfile (interfaces)
    │   ├── value-objects/      # CalendarDate
    │   ├── services/           # ReadingStats/ReadingStatsCalculator, VersionComparator,
    │   │                       # FriendshipHelpers, ReadMatch/ReadMatchCalculator
    │   └── repositories/       # I*Repository (10 ports)
    ├── application/use-cases/  # 1 classe por caso de uso, método execute()
    │   ├── GetReadingLog.ts · ToggleReadingDay.ts · SearchBooks.ts · CheckForUpdate.ts
    │   ├── auth/               # SignIn, SignUp, SignOut
    │   ├── profile/            # GetProfile, UpdateAvatar, UpdateDisplayName
    │   ├── showcase/           # GetShowcase, AddToShowcase, RemoveFromShowcase
    │   ├── friends/            # GetFriends, SendFriendRequest, AcceptFriendRequest,
    │   │                       # DeclineFriendRequest, RemoveFriend, GetPendingRequestsCount
    │   ├── chat/                # GetConversation, SendMessage, MarkConversationRead
    │   ├── community/          # SearchUsers, GetPublicShowcase
    │   └── readmatch/          # CompareReadingActivity
    ├── infrastructure/
    │   ├── di/container.ts     # Composition root — ÚNICO lugar que instancia concretos
    │   ├── supabase/client.ts  # Client singleton (AsyncStorage, publishable key)
    │   ├── auth/               # SupabaseAuthRepository
    │   ├── persistence/        # SupabaseReadingRepository (save diff-based), SupabaseShowcaseRepository,
    │   │                       # SupabaseFriendshipRepository, SupabaseMessageRepository (+ Realtime),
    │   │                       # SupabasePublicProfileRepository, SupabaseReadMatchRepository
    │   ├── profile/            # SupabaseProfileRepository (tabela profiles + bucket avatars)
    │   ├── catalog/            # GoogleBooksCatalogRepository (fetch + normalização https)
    │   └── version/            # SupabaseAppVersionRepository (só leitura — CI escreve via Secret key)
    └── presentation/
        ├── screens/            # HomeScreen, ShowcaseScreen, ProfileScreen, LoginScreen, CommunityScreen
        ├── components/         # ReadButton (hold 1,5s), MonthCalendar, StatsCard, BookPickerModal,
        │                       # UpdateModal, ShowcaseGrid, PublicShowcaseView, ChatModal, ReadMatchModal
        ├── store/              # useAuthStore, useReadingStore, useShowcaseStore, useProfileStore,
        │                       # useUpdateStore, useFriendsStore, useChatStore, useCommunityStore, useReadMatchStore
        ├── navigation/         # RootTabs (bottom tabs: Leitura/Vitrine/Comunidade/Perfil)
        ├── theme/theme.ts      # Design tokens (dark)
        └── utils/calendar.ts   # Helpers de grade do calendário
```

## 10. Guia de modificação — onde mexer para cada tipo de tarefa

| Tarefa | Onde mexer (nesta ordem) |
| --- | --- |
| Nova regra de negócio sobre leituras | `domain/entities/ReadingLog.ts` (invariante) → caso de uso → store |
| Nova estatística | `domain/services/ReadingStats.ts` + `ReadingStatsCalculator.ts` → `StatsCard` |
| Nova fonte de dados/backend | Nova implementação em `infrastructure/` da interface existente → trocar em `container.ts` (só) |
| Novo dado persistido | `migrations/` (SQL idempotente + RLS) → port em `domain/repositories/` → adaptador → caso de uso → `container.ts` → store → tela |
| Nova tela/aba | `presentation/screens/` → registrar em `RootTabs.tsx` (+ `RootTabParamList` e `ICONS`) |
| Mudança visual | `theme.ts` para tokens; componente/tela para layout |
| Novo caso de uso | Classe com `execute()` em `application/use-cases/<área>/` → instanciar em `container.ts` → expor via store |

### Invariantes que NÃO podem ser quebradas

1. **Componentes de UI não importam `container` nem repositórios concretos** — tudo via store.
2. **Datas de leitura são dias civis locais** (`CalendarDate`), nunca `Date`/UTC cru.
3. **Não é possível marcar leitura em data futura** (validado no aggregate).
4. **Toda tabela nova precisa de RLS** com escopo `auth.uid() = user_id`.
5. **Somente a publishable key do Supabase** no cliente; nunca a secret key.
6. **`load()` antes de `save()`** no `IReadingRepository` (o save é diff-based).
7. **Store nova com dados por usuário** deve ter `reset()` registrado no listener de sessão do `useAuthStore`.
8. Migrações SQL devem ser **idempotentes** (`if not exists` / `drop policy if exists`).
9. **`app_versions` só é escrita pelo CI** (Secret key); o app/cliente nunca deve ter permissão de insert/update/delete nessa tabela.
10. **Read Match e chat exigem amizade aceita** (`status = 'accepted'`) — sempre
    validado via RLS/`are_friends()`, nunca só no client. `CompareReadingActivity`
    faz uma checagem explícita antes de consultar (ver Gotchas).
11. **`friendships` sempre grava o par ordenado** (`user_low < user_high`) —
    nunca faça insert/update/delete por par sem passar por
    `FriendshipHelpers.sortedPair` primeiro.
12. **Novas policies públicas** (`using (true)`, como as de `profiles` e
    `showcase_books`) só podem expor colunas não sensíveis — não adicione uma
    coluna sensível a essas tabelas sem revisar a policy antes.

### Gotchas conhecidos

- O client Supabase lança **no import** sem `.env` — não importe infraestrutura em código que precise rodar sem ambiente configurado.
- Capas do Google Books podem vir em `http:`; o adaptador normaliza para `https:` (Android bloqueia cleartext). Mantenha isso em novos campos de imagem.
- `expo-image-picker` tem permissão declarada no plugin em `app.json` (texto pt-BR). Novas permissões nativas exigem novo build (não funcionam via OTA/Expo Go automaticamente).
- `predictiveBackGestureEnabled: false` no Android é intencional.
- O streak "perdoa" o dia corrente: se hoje ainda não foi marcado, a contagem parte de ontem. Não trate isso como bug.
- `Constants.expoConfig.version` só reflete a versão *real* baked na build (útil porque `appVersionSource: "remote"` deixa o EAS resolver/incrementar a versão) — não confie no `version` estático de `app.json` como a versão instalada em produção.
- O filtro de `postgres_changes` do Supabase Realtime só suporta **uma
  comparação simples de coluna** — não dá para filtrar `sender_id` e
  `recipient_id` juntos numa única assinatura. `SupabaseMessageRepository.subscribeToConversation`
  assina só `sender_id=eq.<amigo>` (mensagens vindas do amigo); mensagens que
  o próprio usuário envia chegam pelo retorno otimista de `send()`, não pelo
  canal. Sincronização do próprio usuário em múltiplos dispositivos
  simultâneos não é suportada nesta versão.
- `alter publication supabase_realtime add table ...` **não é idempotente**
  por padrão (falha se a tabela já foi adicionada) — sempre use o guard
  `do $$ ... end $$` com `pg_publication_tables`, como em `010720262330.sql`.
- Queries entre usuários que **não são amigos** (Read Match, ou tentar ler
  `reading_days` de alguém) são bloqueadas pela RLS **silenciosamente** — o
  Postgres devolve uma lista vazia, não um erro. Por isso
  `CompareReadingActivity` confere a amizade explicitamente antes de
  consultar, em vez de deixar a RLS "resolver" com uma mensagem confusa.
- `useFriendsStore` lê `useAuthStore.getState().session?.userId` (para saber
  "quem sou eu" ao chamar casos de uso como `GetFriends`/`AcceptFriendRequest`,
  que precisam do id explicitamente), e `useAuthStore` importa `useFriendsStore`
  (entre outras) para o `reset()` no listener de sessão — é uma dependência
  circular entre os dois módulos, mas segura: nenhum dos dois acessa o outro
  no escopo do módulo, só dentro de funções chamadas depois que ambos já
  terminaram de carregar.

## 11. Verificação de atualização (fluxo completo)

Como o app é distribuído por sideload (APK do EAS), não existe atualização
automática do sistema operacional — este mecanismo é a substituição caseira
para isso.

```mermaid
sequenceDiagram
    participant CI as GitHub Actions (push em master)
    participant EAS as EAS Build
    participant DB as Supabase (app_versions)
    participant APP as App (boot)
    participant ST as useUpdateStore
    participant UC as CheckForUpdate
    participant REPO as SupabaseAppVersionRepository
    participant MODAL as UpdateModal
    actor U as Usuário

    CI->>EAS: eas build --platform android --profile production --json
    EAS-->>CI: JSON com artifacts.buildUrl + appVersion
    CI->>DB: POST /rest/v1/app_versions (Secret key)

    APP->>ST: check() (useEffect no App.tsx, paralelo ao auth init)
    ST->>UC: execute(Constants.expoConfig.version)
    UC->>REPO: getLatest()
    REPO->>DB: select version, apk_url, release_notes<br/>order by created_at desc limit 1
    DB-->>REPO: última linha (ou nenhuma)
    REPO-->>UC: AppVersion | null
    UC->>UC: VersionComparator.isNewer(latest.version, currentVersion)
    UC-->>ST: UpdateInfo { available, latestVersion, apkUrl, releaseNotes }
    ST-->>MODAL: available && !dismissed && apkUrl → renderiza

    alt usuário toca "Baixar atualização"
        U->>MODAL: onPress
        MODAL->>U: Linking.openURL(apkUrl) — abre o navegador/gerenciador de downloads
    else usuário toca "Agora não"
        U->>MODAL: onPress
        MODAL->>ST: dismiss()
        Note over ST: dismissed=true só nesta sessão em memória —<br/>volta a perguntar na próxima abertura do app
    end
```

Pontos de atenção:

- **Falha de rede/checagem nunca deve travar o app** — `useUpdateStore.check()`
  captura qualquer exceção e apenas marca `checked: true` sem mostrar nada. Se
  for adicionar lógica nova aqui, preserve esse fail-safe.
- O `dismiss()` não persiste em disco (não usa AsyncStorage) — é
  deliberadamente efêmero por sessão. Se pedirem para "não perguntar de novo
  nesta versão", isso exigiria persistir a versão dispensada localmente; não
  implemente isso a menos que solicitado.
- `CheckForUpdate.execute()` recebe a versão atual como **parâmetro** (não lê
  `expo-constants` diretamente) para manter a camada `application/` livre de
  dependências de Expo/React Native — quem lê `Constants.expoConfig.version` é
  a store (`presentation/`), que é a fronteira certa para isso.
- Antes do primeiro build publicar uma linha em `app_versions`, `getLatest()`
  retorna `null` e nenhum pop-up aparece — comportamento seguro por padrão.

## 12. Comunidade (fluxo completo)

### Convite de amizade: enviar → aceitar/recusar

```mermaid
sequenceDiagram
    actor A as Usuário A
    actor B as Usuário B
    participant CS as CommunityScreen (A)
    participant FST as useFriendsStore
    participant UC as SendFriendRequest / AcceptFriendRequest / DeclineFriendRequest
    participant REPO as SupabaseFriendshipRepository
    participant DB as Supabase (friendships)

    A->>CS: busca B na aba "Buscar" e toca "Adicionar"
    CS->>FST: sendRequest(B.userId)
    FST->>UC: execute(targetUserId, currentUserId)
    UC->>REPO: sendRequest(targetUserId)
    REPO->>REPO: FriendshipHelpers.sortedPair(A, B)
    REPO->>DB: insert (user_low, user_high, requested_by=A, status='pending')
    DB-->>REPO: linha criada (ou 23505 se já existir convite/amizade)
    REPO-->>FST: Friendship
    FST->>FST: init() [recarrega friends/incoming/outgoing/pendingCount]

    Note over B: pendingCount (badge da aba Comunidade) reflete o convite no próximo fetchPendingCount()/init()

    B->>CS: abre aba "Pedidos" → "Recebidos" → toca "Aceitar" (ou "Recusar")
    CS->>FST: accept(A.userId) [ou decline(A.userId)]
    FST->>UC: execute(requesterUserId, currentUserId)
    UC->>UC: confere status='pending' e que quem aceita NÃO é requested_by
    UC->>REPO: accept(otherUserId) [update status='accepted'] ou decline [delete]
    REPO->>DB: update/delete por (user_low, user_high)
    DB-->>REPO: linha atualizada/removida
    REPO-->>FST: Friendship | void
    FST->>FST: init()
```

### Chat: enviar mensagem e receber em tempo real

```mermaid
sequenceDiagram
    actor A as Usuário A
    actor B as Usuário B
    participant CM as ChatModal (A)
    participant CST as useChatStore (A)
    participant UC as SendMessage
    participant REPO as SupabaseMessageRepository
    participant DB as Supabase (messages)
    participant RT as Supabase Realtime
    participant CST_B as useChatStore (B, canal aberto)

    A->>CM: abre conversa com B
    CM->>CST: openConversation(B.userId)
    CST->>REPO: subscribeToConversation(B.userId, onMessage)
    REPO->>RT: channel(...).on('postgres_changes', filter sender_id=eq.B) .subscribe()

    A->>CM: digita e envia
    CM->>CST: send(body)
    CST->>UC: execute(recipientId=B, body)
    UC->>UC: valida body.trim() não vazio
    UC->>REPO: send(recipientId, body)
    REPO->>DB: insert (sender_id=A, recipient_id=B) [RLS exige are_friends(A,B)]
    DB-->>REPO: linha inserida (id, created_at reais)
    REPO-->>CST: Message
    CST->>CST: append otimista em messages (bolha de A aparece na hora)

    DB->>RT: evento postgres_changes (INSERT)
    RT->>CST_B: onMessage(Message) [canal de B, filtro sender_id=eq.A]
    CST_B->>CST_B: append em messages (bolha de A aparece pro B em tempo real)
```

Pontos de atenção:

- O filtro de Realtime só cobre mensagens **recebidas** (ver Gotchas na seção
  10) — o remetente vê a própria mensagem via o retorno otimista de
  `send()`, não pelo canal.
- `CompareReadingActivity` (Read Match) segue o mesmo princípio de checagem
  explícita de amizade **antes** de consultar `IReadMatchRepository`, em vez
  de confiar apenas na RLS devolver vazio — evita uma UI confusa de "nenhuma
  leitura" quando na verdade é "vocês não são amigos".
- `useChatStore.closeConversation()`/`reset()` sempre fecham o canal Realtime
  (`unsubscribe()`) antes de limpar o estado — um canal aberto sobrevivendo à
  troca de conversa ou de usuário vazaria mensagens de uma conversa para
  outra tela.
