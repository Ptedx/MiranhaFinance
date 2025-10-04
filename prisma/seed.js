/* eslint-disable no-console */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Minimal seed: a demo user and default categories
  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    create: { email: "demo@example.com", name: "Demo User" },
    update: {},
  });

  const parent = await prisma.category.create({
    data: { userId: user.id, name: "Essentials", color: "#10B981" },
  });

  const defaults = [
    "Housing",
    "Groceries",
    "Transport",
    "Utilities",
    "Health",
    "Leisure",
    "Investments",
  ];

  for (const name of defaults) {
    await prisma.category.create({
      data: { userId: user.id, name, parentId: parent.id },
    });
  }

  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

