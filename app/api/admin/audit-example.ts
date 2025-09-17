// Example API route with RBAC and audit logging
import { NextApiRequest, NextApiResponse } from 'next';
import { withRBAC } from '../../../scripts/rbac-middleware';
import { withAuditLogging } from '../../../scripts/audit-logging-middleware';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // ...business logic...
  res.status(200).json({ message: 'Admin action performed.' });
}

export default withRBAC(withAuditLogging(handler, 'admin_action'), 'admin');
