// RBAC Middleware Example
import { NextApiRequest, NextApiResponse } from 'next';

const rolesPermissions = {
  admin: ['*'],
  user: ['read', 'book'],
  provider: ['read', 'book', 'manage'],
};

export function withRBAC(handler: any, requiredRole: string) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const userRole = req.headers['x-user-role'] || 'user';
    if (!rolesPermissions[userRole] || (rolesPermissions[userRole].indexOf(requiredRole) === -1 && rolesPermissions[userRole].indexOf('*') === -1)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return handler(req, res);
  };
}
