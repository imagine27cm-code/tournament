# Tourney (Round Robin + BO3 + Map Bans)

Прототип веб‑сервиса для киберспортивных турниров:
- круговая система (каждый с каждым 1 раз),
- матчи BO3,
- процесс банов карт перед матчем,
- роли PLAYER/ADMIN,
- NextAuth (email/пароль),
- Prisma + SQLite (можно заменить на PostgreSQL),
- Socket.IO (таймер банов с авто‑баном при истечении времени).

## Быстрый старт (Windows)

```bash
cd tourney
npm i
npm run db:migrate
npm run db:seed
npm run dev
```

Откройте `http://localhost:3000`.

## Данные администратора (seed)

После `npm run db:seed`:
- **email**: `admin@example.com`
- **password**: `admin123`

## Основные страницы

- `/` — список турниров
- `/register`, `/signin`
- `/dashboard` — команды (создание)
- `/admin` — создание турнира, запуск Round Robin
- `/tournaments/[id]` — таблица + туры/матчи
- `/matches/[id]` — матч + баны + BO3

## API (основное)

- `POST /api/auth/register`
- `GET/POST /api/teams`
- `POST /api/teams/[teamId]/invites` → `{ joinUrl }`
- `POST /api/team-invites/[token]/accept`
- `GET/POST /api/tournaments`
- `POST /api/tournaments/[id]/registrations`
- `POST /api/tournaments/[id]/registrations/[regId]/approve`
- `POST /api/tournaments/[id]/start`
- `GET /api/tournaments/[id]`
- `GET /api/matches/[id]`
- `POST /api/matches/[id]/ready`
- `POST /api/matches/[id]/ban`
- `POST /api/matches/[id]/report-game`

## Примечания по банам

- Пул карт: 15 карт на турнир (`TournamentMap`).
- Очерёдность: Team1 банит 1 → Team2 банит 2 → Team1 банит 1 (4 бана).
- Таймер: 60 сек на ход. Если время вышло — сервер автоматически банит случайную карту.
- После 4 банов карта для Game1 выбирается случайно из оставшихся 11.

## PostgreSQL вместо SQLite (по желанию)

1) Поставьте PostgreSQL и создайте БД  
2) В `.env` поменяйте `DATABASE_URL` на postgres‑строку  
3) В `prisma/schema.prisma` поменяйте `provider` на `"postgresql"`  
4) Перегенерируйте миграции/примените их

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
