import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-unused-vars
  var prisma: PrismaClient | undefined;
}

export const db =
  global.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

export const prisma = db;
export default db;

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}
