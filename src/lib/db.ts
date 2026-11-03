import "server-only";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const u = new URL(process.env.DATABASE_URL!);
const adapter = new PrismaMariaDb({
  host: u.hostname,
  port: Number(u.port || 3306),
  user: decodeURIComponent(u.username),
  password: decodeURIComponent(u.password),
  database: u.pathname.slice(1),
});

// Reaproveita a conexão entre recarregamentos do modo dev.
const g = globalThis as unknown as { prisma?: PrismaClient };
export const db = (g.prisma ??= new PrismaClient({ adapter }));
