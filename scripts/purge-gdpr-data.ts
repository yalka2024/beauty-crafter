// GDPR/CCPA Data Purging Script (Node.js/Prisma)

import { prisma } from '../lib/prisma';

async function purgeOldUserData(days = 365) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  // Purge users who requested deletion and are past retention
  await prisma.user.deleteMany({
    where: {
      deletedAt: { lte: cutoff },
      status: 'deleted',
    },
  });
  // Purge old bookings, logs, etc. as needed
  // ...add more purging logic here...
  console.log('GDPR/CCPA data purging complete.');
}

purgeOldUserData().catch(console.error);
