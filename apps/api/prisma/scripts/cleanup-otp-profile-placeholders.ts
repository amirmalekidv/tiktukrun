#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { fullName: { not: null } },
        { email: { not: null } },
        { nickname: { not: null } },
      ],
    },
    select: {
      id: true,
      mobile: true,
      fullName: true,
      email: true,
      nickname: true,
    },
  });

  let updated = 0;

  for (const user of users) {
    const mobileSeed = user.mobile.replace(/\D/g, '');
    const placeholderEmail = `${mobileSeed}@users.tiktakrun.local`;
    const placeholderNickname = `user_${mobileSeed}`;
    const data: { fullName?: null; email?: null; nickname?: null } = {};

    if (user.fullName === user.mobile) data.fullName = null;
    if (user.email === placeholderEmail) data.email = null;
    if (user.nickname === placeholderNickname) data.nickname = null;

    if (Object.keys(data).length === 0) continue;

    await prisma.user.update({
      where: { id: user.id },
      data,
    });
    updated += 1;
  }

  console.log(`Updated ${updated} user(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
