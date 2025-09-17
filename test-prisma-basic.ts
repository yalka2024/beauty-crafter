import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findUnique({
    where: { id: 'test-id' },
  });
  console.log(user);
}

test();
