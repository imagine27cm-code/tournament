import http from "http";
import next from "next";
import { Server as IOServer } from "socket.io";
import { prisma } from "./lib/prisma";
import { nextPhase, phaseOwnerTeamId, randomMap } from "./lib/banFlow";

const dev = process.env.NODE_ENV !== "production";
const port = parseInt(process.env.PORT ?? "3000", 10);

const app = next({ dev, hostname: "localhost", port });
const handle = app.getRequestHandler();

async function autoBanTick(io: IOServer) {
  const now = new Date();
  const expired = await prisma.match.findMany({
    where: {
      status: "BANNING",
      banTurnEndsAt: { lt: now },
      banPhase: { not: "DONE" },
    },
    include: {
      tournament: { include: { maps: true } },
      bans: true,
    },
    take: 20,
  });

  for (const m of expired) {
    await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id: m.id },
        include: { tournament: { include: { maps: true } }, bans: true },
      });
      if (!match) return;
      if (match.status !== "BANNING" || match.banPhase === "DONE") return;
      if (!match.banTurnEndsAt || match.banTurnEndsAt.getTime() >= Date.now()) return;

      const bannedSet = new Set(match.bans.map((b) => b.mapId));
      const pick = randomMap(match.tournament.maps, bannedSet);
      if (!pick) return;

      const actingTeamId = phaseOwnerTeamId(match, match.banPhase);
      if (!actingTeamId) return;

      const banOrder = match.bans.length + 1;
      await tx.matchBan.create({
        data: { matchId: match.id, teamId: actingTeamId, mapId: pick.id, banOrder },
      });

      const newPhase = nextPhase(match.banPhase);
      if (newPhase === "DONE") {
        bannedSet.add(pick.id);
        const map1 = randomMap(match.tournament.maps, bannedSet);
        if (!map1) return;

        await tx.matchGame.create({
          data: { matchId: match.id, gameNumber: 1, mapId: map1.id },
        });
        await tx.match.update({
          where: { id: match.id },
          data: {
            banPhase: "DONE",
            banTurnTeamId: null,
            banTurnEndsAt: null,
            status: "IN_PROGRESS",
            startedAt: new Date(),
          },
        });
      } else {
        const nextTurn = phaseOwnerTeamId(match, newPhase);
        await tx.match.update({
          where: { id: match.id },
          data: {
            banPhase: newPhase,
            banTurnTeamId: nextTurn ?? null,
            banTurnEndsAt: new Date(Date.now() + 60_000),
          },
        });
      }
    });

    io.to(`match:${m.id}`).emit("match:update", { matchId: m.id });
  }
}

app
  .prepare()
  .then(() => {
    const server = http.createServer((req, res) => handle(req, res));
    const io = new IOServer(server, {
      path: "/socket.io",
      cors: { origin: "*" },
    });

    io.on("connection", (socket) => {
      socket.on("joinMatch", (matchId: string) => socket.join(`match:${matchId}`));
      socket.on("leaveMatch", (matchId: string) => socket.leave(`match:${matchId}`));
      socket.on("joinTournament", (tournamentId: string) => socket.join(`tournament:${tournamentId}`));
      socket.on("leaveTournament", (tournamentId: string) => socket.leave(`tournament:${tournamentId}`));
    });

    setInterval(() => {
      autoBanTick(io).catch(() => {});
    }, 2000);

    server.listen(port, () => {
      console.log(`> Ready on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

