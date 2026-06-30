import { Router } from 'express';
import db from '../db.js';
import { requireAdmin } from '../middleware/admin.js';

const router = Router();

router.use(requireAdmin);

function maskPhone(phone) {
  if (!phone || phone.length < 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

function maskEmail(email) {
  if (!email) return null;
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const masked = name.length <= 2 ? `${name[0]}*` : `${name.slice(0, 2)}***`;
  return `${masked}@${domain}`;
}

router.get('/stats', (_req, res) => {
  const overview = db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM users) AS total_users,
        (SELECT COUNT(*) FROM elders) AS total_elders,
        (SELECT COUNT(*) FROM chat_sessions) AS total_sessions,
        (SELECT COUNT(*) FROM chat_sessions WHERE summary IS NOT NULL) AS total_summaries,
        (SELECT COUNT(*) FROM memories) AS total_memories,
        (SELECT MAX(COALESCE(ended_at, started_at)) FROM chat_sessions) AS last_activity_at`
    )
    .get();

  const users = db
    .prepare('SELECT id, phone, email, created_at FROM users ORDER BY created_at DESC')
    .all();

  const elderStatsStmt = db.prepare(
    `SELECT
      e.id,
      e.name,
      e.age,
      e.relationship,
      e.created_at,
      e.elder_consent_at,
      COUNT(cs.id) AS chat_count,
      SUM(CASE WHEN cs.summary IS NOT NULL THEN 1 ELSE 0 END) AS summary_count,
      MAX(COALESCE(cs.ended_at, cs.started_at)) AS last_chat_at
    FROM elders e
    LEFT JOIN chat_sessions cs ON cs.elder_id = e.id
    WHERE e.user_id = ?
    GROUP BY e.id
    ORDER BY e.created_at DESC`
  );

  const elderCountStmt = db.prepare(
    'SELECT COUNT(*) AS count FROM elders WHERE user_id = ?'
  );

  const result = users.map((user) => ({
    id: user.id,
    phone: maskPhone(user.phone),
    email: maskEmail(user.email),
    created_at: user.created_at,
    elder_count: elderCountStmt.get(user.id).count,
    elders: elderStatsStmt.all(user.id).map((elder) => ({
      id: elder.id,
      name: elder.name,
      age: elder.age,
      relationship: elder.relationship,
      created_at: elder.created_at,
      elder_consent_at: elder.elder_consent_at,
      chat_count: elder.chat_count,
      summary_count: elder.summary_count,
      last_chat_at: elder.last_chat_at,
    })),
  }));

  res.json({ overview, users: result });
});

export default router;
