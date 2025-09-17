// GDPR/CCPA user data export and deletion endpoints
import { NextApiRequest, NextApiResponse } from 'next';
import { anonymizeUser, deleteUser } from '../../../scripts/data-anonymization';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId, action } = req.body;
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  if (action === 'export') {
    // Export all user data (PII, profile, bookings, etc.)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        address: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Optionally: redact sensitive fields
    return res.status(200).json({ user });
  }
  if (action === 'delete') {
    await deleteUser(userId);
    return res.status(200).json({ message: 'User deleted.' });
  }
  if (action === 'anonymize') {
    await anonymizeUser(userId);
    return res.status(200).json({ message: 'User anonymized.' });
  }
  res.status(400).json({ error: 'Invalid action' });
}
