import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed production");
  console.log("Development seed is intentionally empty. Create an owner through the bootstrap flow.");
}
main().finally(() => prisma.$disconnect());
