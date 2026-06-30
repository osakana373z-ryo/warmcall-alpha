import { ADMIN_KEY } from '../config.js';

export function requireAdmin(req, res, next) {
  const key = req.headers['x-admin-key'];
  if (key !== ADMIN_KEY) {
    return res.status(403).json({ error: '无效的管理员密钥' });
  }
  next();
}
