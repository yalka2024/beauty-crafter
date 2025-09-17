// GDPR/CCPA Data Purging Script Example
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function purgeOldUserData() {
  const cutoff = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // 1 year
  const result = await prisma.user.deleteMany({
    where: {
      deletedAt: { lte: cutoff },
      status: 'deleted',
    },
  });
  console.log('GDPR/CCPA data purging complete. Deleted:', result.count);
}

if (require.main === module) {
  purgeOldUserData().catch(console.error);
}
