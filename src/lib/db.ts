import { copyFileSync, existsSync, renameSync } from "fs";
import path from "path";

/* ── serverless SQLite seed (Vercel): copy the bundled db to the DATABASE_URL
   target before the first PrismaClient opens it. The lambda filesystem is
   read-only except /tmp; the seed db travels inside the function bundle via
   outputFileTracingIncludes (next.config.ts). Atomic staging+rename is safe
   under the concurrent cold-start requests a lambda can receive. */
if (process.env.VERCEL && process.env.DATABASE_URL?.startsWith("file:")) {
  try {
    const target = process.env.DATABASE_URL.slice("file:".length);
    if (!existsSync(target)) {
      const source = path.join(process.cwd(), "db", "custom.db");
      const staging = `${target}.${process.pid}.${Date.now()}.tmp`;
      copyFileSync(source, staging);
      renameSync(staging, target);
    }
  } catch (e) {
    console.error("[db] serverless seed copy failed", e);
  }
}

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db