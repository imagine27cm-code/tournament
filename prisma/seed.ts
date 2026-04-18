import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

async function main() {
  // Создаем админа
  const adminEmail = "admin@example.com";
  const adminPassword = "admin123";
  const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: "ADMIN",
      name: "Admin",
    },
  });

  console.log(`Seeded admin: ${adminEmail} / ${adminPassword}`);

  // Создаем 20 игроков
  const players = [];
  for (let i = 1; i <= 20; i++) {
    const email = `player${i}@example.com`;
    const password = `player${i}123`;
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        passwordHash,
        role: "PLAYER",
        name: `Игрок ${i}`,
      },
    });

    players.push(user);
    console.log(`Seeded player: ${email} / ${password}`);
  }

  // Создаем админа (получаем его ID)
  const admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    console.error("Admin not found!");
    return;
  }

  // Создаем 10 команд (по 2 игрока в каждой)
  const teams = [];
  for (let i = 0; i < 10; i++) {
    const captain = players[i * 2];
    const member = players[i * 2 + 1];

    const team = await prisma.team.create({
      data: {
        name: `Team ${i + 1}`,
        captainId: captain.id,
        members: {
          create: [
            { userId: captain.id, isCaptain: true },
            { userId: member.id, isCaptain: false },
          ],
        },
      },
      include: { members: true },
    });

    teams.push(team);
    console.log(`Seeded team: ${team.name} (Captain: ${captain.name})`);
  }

  // Создаем турнир
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + 1);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  // Получаем имена карт из папки maps
  const fs = require("fs");
  const path = require("path");
  let mapNames: string[] = [];
  try {
    const mapsDir = path.join(process.cwd(), "public", "maps");
    const files = fs.readdirSync(mapsDir).filter((f: string) => /\.(png|jpg|jpeg|webp)$/i.test(f));
    mapNames = files.map((f: string) => f.replace(/\.(png|jpg|jpeg|webp)$/i, ""));
  } catch {
    mapNames = Array.from({ length: 15 }, (_, i) => `Map ${i + 1}`);
  }

  const tournament = await prisma.tournament.create({
    data: {
      name: "Test Tournament",
      startDate,
      endDate,
      teamLimit: 10,
      status: "REGISTRATION",
      createdById: admin.id,
      maps: {
        create: mapNames.map((name: string, idx: number) => ({
          name,
          sortOrder: idx + 1,
        })),
      },
    },
    include: { maps: true },
  });

  console.log(`Seeded tournament: ${tournament.name}`);

  // Регистрируем все команды в турнире
  for (const team of teams) {
    await prisma.tournamentRegistration.create({
      data: {
        tournamentId: tournament.id,
        teamId: team.id,
        status: "PENDING",
      },
    });
    console.log(`Registered team: ${team.name} in tournament`);
  }

  // Утверждаем все регистрации
  const registrations = await prisma.tournamentRegistration.findMany({
    where: { tournamentId: tournament.id },
  });

  for (const reg of registrations) {
    await prisma.tournamentRegistration.update({
      where: { id: reg.id },
      data: { status: "APPROVED" },
    });
    console.log(`Approved registration for team: ${reg.teamId}`);
  }

  // Оставляем турнир в статусе REGISTRATION, чтобы можно было запустить через админку
  console.log(`Tournament ${tournament.name} is in REGISTRATION status`);
  console.log(`You can start it in /admin page by clicking "Запустить (генерировать RR)"`);

  console.log("\n=== TEST DATA CREATED ===");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log(`Players: 20 (player1@example.com / player1123, ..., player20@example.com / player20123)`);
  console.log(`Teams: 10 (Team 1, ..., Team 10)`);
  console.log(`Tournament: ${tournament.name}`);
  console.log("\nTo start the tournament, go to /admin and click 'Запустить (генерировать RR)'");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });