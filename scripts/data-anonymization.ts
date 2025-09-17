// Data Anonymization/Deletion Example
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function anonymizeUser(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { email: null, name: null, deleted: true },
  });
}

export async function deleteUser(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}
