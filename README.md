# 📖 Track Read

**Transforme a leitura em hábito — um dia de cada vez.**

Track Read é um app mobile (iOS/Android, feito com Expo/React Native) para
quem quer manter uma sequência de leitura diária, no estilo do gráfico de
contribuições do GitHub, só que para livros. Você segura um botão para
confirmar que leu hoje, acompanha sua sequência (streak), monta uma vitrine
com os livros que possui e associa qual livro leu em cada dia.

<p align="center">
  <img alt="Expo SDK 57" src="https://img.shields.io/badge/Expo-SDK%2057-000020?logo=expo&logoColor=white">
  <img alt="React Native" src="https://img.shields.io/badge/React%20Native-0.86-61DAFB?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white">
  <img alt="Supabase" src="https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase&logoColor=white">
  <img alt="Zustand" src="https://img.shields.io/badge/State-Zustand-543C36">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-blue">
</p>

---

## ✨ Funcionalidades

O app tem três abas: **Leitura**, **Vitrine** e **Perfil**.

### 🏠 Leitura (tela principal)
- **Segure para confirmar**: o botão principal só registra a leitura depois
  de **1,5s segurando** — um toque rápido apenas balança o botão e pede para
  segurar mais. Isso evita marcar (ou desmarcar) o dia sem querer.
- **Sequência (streak)** atual e recorde, total de dias lidos e contagem do
  mês, tudo num painel de estatísticas.
- **Calendário mensal** com o dia marcado em destaque — toque em qualquer
  dia passado para corrigir um esquecimento.
- Regra de negócio: **não é possível marcar leitura em datas futuras**.

### 🖼️ Vitrine
- Busca de livros em tempo real na **Google Books API**, com debounce de
  400ms (não dispara uma chamada por letra digitada).
- Adicione livros à sua vitrine pessoal para reaproveitá-los depois.
- Ao marcar a leitura do dia, o app pergunta **qual livro da vitrine** você
  leu — essa informação fica salva junto do registro do dia.

### 👤 Perfil
- Foto de perfil via galeria (`expo-image-picker`), com recorte quadrado.
- Nome de exibição editável.
- Encerrar sessão.

### 🔐 Autenticação
- Entrar / criar conta com e-mail e senha via **Supabase Auth**.
- Sessão persistida no dispositivo — o app abre direto na tela de Leitura
  se você já estiver logado.

---

## 🏗️ Arquitetura

O código segue **Clean Architecture**, dividida em quatro camadas:

- **`domain/`** — entidades e regras de negócio puras (`ReadingLog`,
  `CalendarDate`, `ReadingStatsCalculator`), sem depender de nada externo.
- **`application/`** — casos de uso que orquestram o domínio e os
  repositórios (`ToggleReadingDay`, `SearchBooks`, `SignIn`...).
- **`infrastructure/`** — implementações concretas das interfaces do
  domínio: `SupabaseReadingRepository`, `SupabaseAuthRepository`,
  `GoogleBooksCatalogRepository`, etc.
- **`presentation/`** — telas, componentes e stores (Zustand) em React
  Native.

O fluxo de dependência é sempre de fora para dentro: a UI chama a store, a
store chama um caso de uso via `container.ts`, o caso de uso aplica a regra
de negócio na entidade e persiste através de uma interface — nunca sabendo
qual implementação concreta está por trás dela. Trocar o Supabase por outro
backend, por exemplo, é uma mudança isolada em `container.ts`.

---

## 🧱 Stack

| Camada             | Tecnologia                                      |
| ------------------- | ------------------------------------------------ |
| Framework           | Expo SDK 57 · React Native 0.86 · React 19        |
| Linguagem           | TypeScript                                        |
| Navegação           | React Navigation (bottom tabs)                    |
| Estado              | Zustand                                           |
| Backend / Auth / DB | Supabase                                          |
| Catálogo de livros  | Google Books API                                  |
| Mídia               | expo-image-picker                                 |

---

## 📂 Estrutura de pastas

```
src/
├── domain/            # Regras de negócio puras — zero dependência externa
│   ├── entities/       → ReadingLog, Book, Profile, Session
│   ├── value-objects/  → CalendarDate
│   ├── services/       → ReadingStatsCalculator (streaks, totais)
│   └── repositories/   → interfaces (IReadingRepository, IAuthRepository...)
│
├── application/        # Casos de uso — orquestram domínio + repositórios
│   ├── use-cases/       (ToggleReadingDay, GetReadingLog, SearchBooks)
│   ├── auth/            (SignIn, SignUp, SignOut)
│   ├── profile/         (GetProfile, UpdateAvatar, UpdateDisplayName)
│   └── showcase/        (GetShowcase, AddToShowcase, RemoveFromShowcase)
│
├── infrastructure/      # Implementações concretas (podem ser trocadas)
│   ├── supabase/        → client único do Supabase
│   ├── auth/            → SupabaseAuthRepository
│   ├── persistence/     → SupabaseReadingRepository, SupabaseShowcaseRepository
│   ├── profile/         → SupabaseProfileRepository
│   ├── catalog/         → GoogleBooksCatalogRepository
│   └── di/               → container.ts (composition root)
│
└── presentation/        # React Native puro
    ├── screens/          (HomeScreen, ShowcaseScreen, ProfileScreen, LoginScreen)
    ├── components/       (ReadButton, MonthCalendar, StatsCard, BookPickerModal)
    ├── store/            (useReadingStore, useShowcaseStore, useProfileStore, useAuthStore)
    ├── navigation/       (RootTabs)
    └── theme/            (design tokens)
```

> Regra de ouro do projeto: **nenhum componente de UI importa `container`,
> uma implementação concreta ou o domínio diretamente** — tudo passa pela
> store correspondente.

---

## 🚀 Rodando localmente

### Pré-requisitos
- Node.js
- Um projeto no [Supabase](https://supabase.com)
- (Opcional, recomendado) uma API key da [Google Books API](https://console.cloud.google.com/apis/library/books.googleapis.com) — sem ela, as buscas caem numa cota anônima compartilhada que se esgota rápido

### Passos
```bash
npm install
cp .env.example .env
# preencha no .env:
#   EXPO_PUBLIC_SUPABASE_URL
#   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
#   EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY

npm start          # abre o Metro / Expo Go
npm run android    # build/dev no Android
npm run ios        # build/dev no iOS
npm run web        # build/dev no navegador
```

> ⚠️ Variáveis `EXPO_PUBLIC_*` são embutidas no bundle em build-time. Depois
> de editar o `.env`, reinicie com `npx expo start -c` para limpar o cache.

---

## 📄 Licença

Distribuído sob os termos descritos em [`LICENSE`](LICENSE).
