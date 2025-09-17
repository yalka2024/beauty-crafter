// Audit Logging Middleware Example
import { NextApiRequest, NextApiResponse } from 'next';

import { forwardLog } from './log-forwarder';
export function auditLogger(action: string, userId: string, details: Record<string, any>) {
  forwardLog({
    timestamp: new Date().toISOString(),
    action,
    userId,
    details,
  });
}

export function withAuditLogging(handler: any, action: string) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const userId = req.headers['x-user-id'] || 'anonymous';
    auditLogger(action, userId as string, { path: req.url, method: req.method });
    return handler(req, res);
  };
}
