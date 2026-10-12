import { hash } from "bcryptjs";
import { encode } from "@auth/core/jwt";
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const prisma = new PrismaClient();
const password = "password123";

async function upsertUser(name, email) {
  const passwordHash = await hash(password, 12);
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash },
    create: { name, email, passwordHash },
  });
}

const alex = await upsertUser("Alex Rivera", "alex@example.com");
const sam = await upsertUser("Sam Chen", "sam@example.com");

const startDate = new Date(Date.UTC(2026, 9, 10));
const endDate = new Date(Date.UTC(2026, 9, 14));

const existing = await prisma.trip.findFirst({ where: { name: "Rome weekend", ownerId: alex.id } });
if (!existing) {
  await prisma.trip.create({
    data: {
      name: "Rome weekend",
      startDate,
      endDate,
      baseCurrency: "USD",
      coverNote: "A short city break.",
      ownerId: alex.id,
      joinToken: "rome-weekend-demo-join-token",
      members: {
        create: [
          { userId: alex.id, role: "ADMIN", status: "ACCEPTED" },
          { userId: sam.id, role: "MEMBER", status: "ACCEPTED" },
        ],
      },
    },
  });
}

async function sessionCookie(user) {
  const token = await encode({
    token: { id: user.id, sub: user.id, email: user.email, name: user.name },
    secret: process.env.AUTH_SECRET,
    salt: "authjs.session-token",
  });
  return `authjs.session-token=${token}`;
}

writeFileSync(".alex.cookie", await sessionCookie(alex));
writeFileSync(".sam.cookie", await sessionCookie(sam));
console.log("Seeded Alex and Sam. Cookies written for local checks.");
await prisma.$disconnect();
