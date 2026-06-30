import jwt from 'jsonwebtoken';
import db from '../db.js';
import { JWT_SECRET } from '../config.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '请先登录' });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db
      .prepare('SELECT id, phone, email, created_at FROM users WHERE id = ?')
      .get(payload.sub);

    if (!user) {
      return res.status(401).json({ error: '用户不存在，请重新登录' });
    }

    req.user = { id: user.id, phone: user.phone, email: user.email };
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

export function getElderForUser(elderId, userId) {
  return db
    .prepare('SELECT * FROM elders WHERE id = ? AND user_id = ?')
    .get(elderId, userId);
}

export function getElderByInviteCode(inviteCode) {
  if (!/^\d{4}$/.test(inviteCode)) return null;
  return db.prepare('SELECT * FROM elders WHERE invite_code = ?').get(inviteCode);
}

export function getSessionForUser(sessionId, userId) {
  return db
    .prepare(
      `SELECT cs.* FROM chat_sessions cs
       JOIN elders e ON e.id = cs.elder_id
       WHERE cs.id = ? AND e.user_id = ?`
    )
    .get(sessionId, userId);
}

export function getSessionForElder(sessionId, elderId) {
  return db
    .prepare('SELECT * FROM chat_sessions WHERE id = ? AND elder_id = ?')
    .get(sessionId, elderId);
}
