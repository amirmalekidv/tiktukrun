#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

async function main(): Promise<void> {
  const hello = (await prisma.$runCommandRaw({ hello: 1 })) as {
    setName?: string;
    isWritablePrimary?: boolean;
  };

  if (hello.setName !== 'rs0') {
    throw new Error(`Replica set is not rs0 (found: ${hello.setName ?? 'missing'})`);
  }

  if (!hello.isWritablePrimary) {
    throw new Error('MongoDB is not writable PRIMARY yet');
  }

  const key = `system.smoke.transaction.${Date.now()}`;

  await prisma.$transaction(async (tx) => {
    await tx.setting.create({
      data: {
        key,
        value: { smoke: true, createdAt: new Date().toISOString() } as any,
        group: 'system',
      },
    });

    const created = await tx.setting.findUnique({ where: { key } });
    if (!created) {
      throw new Error('Failed to read temporary setting inside transaction');
    }

    await tx.setting.delete({ where: { key } });
  });

  const leftover = await prisma.setting.findUnique({ where: { key } });
  if (leftover) {
    await prisma.setting.delete({ where: { key } });
    throw new Error('Transaction cleanup failed; temporary setting still exists');
  }

  console.log('✅ Prisma transaction smoke test passed on MongoDB replica set rs0');
}

main()
  .catch((error) => {
    console.error(`❌ Transaction smoke test failed: ${(error as Error).message}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
