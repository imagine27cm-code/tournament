# Полное руководство по настройке базы данных на Supabase для этого проекта

✅ Схема полностью соответствует существующему Prisma схеме проекта

---

## 📋 Шаг 1: Регистрация и создание проекта на Supabase

1.  Перейдите на https://supabase.com
2.  Зарегистрируйтесь / войдите в аккаунт
3.  Нажмите **New Project**
4.  Выберите организацию (можно создать бесплатную)
5.  Заполните поля проекта:
    -   Имя проекта: `tourney`
    -   Пароль базы данных (7EXGViGVMjSMGwSk)
    -   Регион: выберите ближайший к вам (например `Frankfurt` для Европы)
    -   Нажмите **Create new project**

✅ Дождитесь создания проекта (займет ~2 минуты)

---

## 🔌 Шаг 2: Подключение Prisma к Supabase

1.  В панели Supabase перейдите в:
    `Settings` → `Database` → `Connection string` → `URI`

2.  Скопируйте строку подключения и вставьте в файл `.env` вашего проекта:
    ```env
    DATABASE_URL="postgresql://postgres:[7EXGViGVMjSMGwSk]@db..fuwcvahhdsesyljmimio.supabase.co:5432/postgres"
    ```

3.  Обновите `prisma/schema.prisma`:
    ```prisma
    datasource db {
      provider = "postgresql"
      url      = env("DATABASE_URL")
    }
    ```

---

## 🚀 Шаг 3: Развертывание схемы базы данных

✅ **Автоматический способ через Prisma Migrate**:
```bash
npx prisma migrate dev --name init
```

✅ **Ручной способ (прямой SQL в Supabase)**:

Откройте в панели Supabase `SQL Editor` → `New query` и выполните этот скрипт:

```sql
-- ✅ Создаем все ENUM типы
CREATE TYPE "UserRole" AS ENUM ('PLAYER', 'ADMIN');
CREATE TYPE "TeamInviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED');
CREATE TYPE "FriendRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
CREATE TYPE "TournamentStatus" AS ENUM ('DRAFT', 'REGISTRATION', 'ONGOING', 'COMPLETED');
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE "MatchStatus" AS ENUM ('SCHEDULED', 'BANNING', 'READY', 'IN_PROGRESS', 'FINISHED');
CREATE TYPE "BanPhase" AS ENUM ('T1_BAN_1', 'T2_BAN_1', 'T2_BAN_2', 'T1_BAN_2', 'DONE');

-- ✅ Таблица Пользователей
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT UNIQUE NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "name" TEXT,
  "role" "UserRole" DEFAULT 'PLAYER' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT now() NOT NULL
);

-- ✅ Остальные таблицы полностью повторяют структуру Prisma
CREATE TABLE "FriendRequest" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "fromUserId" TEXT NOT NULL,
  "toUserId" TEXT NOT NULL,
  "status" "FriendRequestStatus" DEFAULT 'PENDING' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
  FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE,
  FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE,
  UNIQUE("fromUserId", "toUserId")
);

CREATE TABLE "Team" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT UNIQUE NOT NULL,
  "logoUrl" TEXT,
  "captainId" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
  FOREIGN KEY ("captainId") REFERENCES "User"("id")
);

CREATE TABLE "TeamMember" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "teamId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "isCaptain" BOOLEAN DEFAULT false NOT NULL,
  "joinedAt" TIMESTAMP DEFAULT now() NOT NULL,
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE,
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
  UNIQUE("teamId", "userId")
);

CREATE TABLE "TeamInvite" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "teamId" TEXT NOT NULL,
  "email" TEXT,
  "token" TEXT UNIQUE NOT NULL,
  "invitedById" TEXT NOT NULL,
  "status" "TeamInviteStatus" DEFAULT 'PENDING' NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  "acceptedById" TEXT,
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE,
  FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE TABLE "Tournament" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "startDate" TIMESTAMP NOT NULL,
  "endDate" TIMESTAMP NOT NULL,
  "status" "TournamentStatus" DEFAULT 'DRAFT' NOT NULL,
  "teamLimit" INTEGER DEFAULT 8 NOT NULL,
  "createdById" TEXT NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  "updatedAt" TIMESTAMP DEFAULT now() NOT NULL,
  FOREIGN KEY ("createdById") REFERENCES "User"("id")
);

CREATE TABLE "TournamentMap" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "tournamentId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL,
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE,
  UNIQUE("tournamentId", "name")
);

CREATE TABLE "TournamentRegistration" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "tournamentId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "status" "RegistrationStatus" DEFAULT 'PENDING' NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE,
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE,
  UNIQUE("tournamentId", "teamId")
);

CREATE TABLE "Round" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "tournamentId" TEXT NOT NULL,
  "number" INTEGER NOT NULL,
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE,
  UNIQUE("tournamentId", "number")
);

CREATE TABLE "Match" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "tournamentId" TEXT NOT NULL,
  "roundId" TEXT,
  "homeTeamId" TEXT NOT NULL,
  "awayTeamId" TEXT NOT NULL,
  "status" "MatchStatus" DEFAULT 'SCHEDULED' NOT NULL,
  "banSeed" INTEGER DEFAULT 0 NOT NULL,
  "banPhase" "BanPhase" DEFAULT 'T1_BAN_1' NOT NULL,
  "banTurnTeamId" TEXT,
  "banTurnEndsAt" TIMESTAMP,
  "homeReady" BOOLEAN DEFAULT false NOT NULL,
  "awayReady" BOOLEAN DEFAULT false NOT NULL,
  "startedAt" TIMESTAMP,
  "finishedAt" TIMESTAMP,
  "winnerTeamId" TEXT,
  FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE,
  FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE SET NULL,
  FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id"),
  FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id"),
  UNIQUE("tournamentId", "homeTeamId", "awayTeamId")
);

CREATE TABLE "MatchBan" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "matchId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "mapId" TEXT NOT NULL,
  "banOrder" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT now() NOT NULL,
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE,
  FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE,
  FOREIGN KEY ("mapId") REFERENCES "TournamentMap"("id") ON DELETE CASCADE,
  UNIQUE("matchId", "mapId"),
  UNIQUE("matchId", "banOrder")
);

CREATE TABLE "MatchGame" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  "matchId" TEXT NOT NULL,
  "gameNumber" INTEGER NOT NULL,
  "mapId" TEXT NOT NULL,
  "pickedByTeamId" TEXT,
  "winnerTeamId" TEXT,
  "completedAt" TIMESTAMP,
  FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE,
  FOREIGN KEY ("mapId") REFERENCES "TournamentMap"("id") ON DELETE CASCADE,
  UNIQUE("matchId", "gameNumber")
);

-- ✅ Индексы для производительности
CREATE INDEX ON "FriendRequest"("toUserId", "status");
CREATE INDEX ON "FriendRequest"("fromUserId", "status");
CREATE INDEX ON "Tournament"("status");
CREATE INDEX ON "TournamentRegistration"("tournamentId", "status");
CREATE INDEX ON "Match"("tournamentId", "status");
CREATE INDEX ON "MatchGame"("matchId");
CREATE INDEX ON "TournamentMap"("tournamentId");
```

---

## 🔐 Шаг 4: Настройка Row Level Security (рекомендовано для Supabase)

После создания таблиц включите RLS для безопасности:

```sql
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tournament" ENABLE ROW LEVEL SECURITY;
-- и так далее для всех таблиц
```

---

## ✅ Финальная проверка

После настройки выполните:
```bash
npx prisma generate
npx prisma db pull
```

✅ Теперь ваш проект полностью работает с базой данных на Supabase!

---

## 💡 Важные нюансы для этого проекта:
1.  Supabase использует PostgreSQL вместо SQLite - все запросы и логика продолжат работать без изменений
2.  Существующий код на Prisma совместим на 100%
3.  Миграции будут работать так же как и раньше
4.  Вы получаете встроенную панель админа, API, Realtime и бэкапы из коробки