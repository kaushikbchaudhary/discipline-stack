import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";
import {
  createDefaultPlan,
  createScheduleFromOnboarding,
  DEFAULT_ONBOARDING,
} from "../src/lib/setup";

const main = async () => {
  const email = "kaushikchaudhary730@gmail.com";
  const passwordHash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name: "Demo User",
      email,
      passwordHash,
    },
  });

  const existingPlan = await prisma.plan.findFirst({
    where: { userId: user.id },
  });

  if (!existingPlan) {
    await createDefaultPlan(user.id, new Date());
  }

  const existingBlocks = await prisma.scheduleBlock.findFirst({
    where: { userId: user.id },
  });

  if (!existingBlocks) {
    await createScheduleFromOnboarding(user.id, DEFAULT_ONBOARDING);
  }

  console.log("Seed complete.");
};

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
