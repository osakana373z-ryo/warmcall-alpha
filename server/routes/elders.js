import { Router } from 'express';
import db, { generateInviteCode } from '../db.js';
import { requireAuth, getElderForUser } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth);

function parseElder(row) {
  if (!row) return null;
  return {
    id: row.id,
    user_id: row.user_id,
    invite_code: row.invite_code,
    name: row.name,
    age: row.age,
    relationship: row.relationship,
    hobbies: row.hobbies,
    health_reminders: row.health_reminders,
    family_members: row.family_members ? JSON.parse(row.family_members) : [],
    elder_consent_at: row.elder_consent_at,
    created_at: row.created_at,
  };
}

router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT * FROM elders WHERE user_id = ? ORDER BY created_at DESC')
    .all(req.user.id);
  res.json(rows.map(parseElder));
});

router.get('/:id/sessions', (req, res) => {
  const elder = getElderForUser(req.params.id, req.user.id);
  if (!elder) return res.status(404).json({ error: '老人资料不存在' });

  const sessions = db
    .prepare(
      `SELECT cs.id, cs.elder_id, cs.started_at, cs.ended_at, cs.summary,
              (SELECT COUNT(*) FROM chat_messages cm WHERE cm.session_id = cs.id AND cm.role = 'user') AS user_message_count
       FROM chat_sessions cs
       WHERE cs.elder_id = ?
       ORDER BY COALESCE(cs.ended_at, cs.started_at) DESC`
    )
    .all(elder.id);

  res.json(sessions);
});

router.get('/:id', (req, res) => {
  const row = getElderForUser(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: '老人资料不存在' });
  res.json(parseElder(row));
});

router.post('/', (req, res) => {
  const { name, age, relationship, hobbies, health_reminders, family_members, parent_consent } =
    req.body;

  if (!name?.trim()) {
    return res.status(400).json({ error: '姓名为必填项' });
  }

  if (!parent_consent) {
    return res.status(400).json({ error: '添加老人资料前，请先阅读并同意隐私说明' });
  }

  const inviteCode = generateInviteCode();

  const result = db
    .prepare(
      `INSERT INTO elders (user_id, invite_code, name, age, relationship, hobbies, health_reminders, family_members)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      req.user.id,
      inviteCode,
      name.trim(),
      age ?? null,
      relationship?.trim() || null,
      hobbies?.trim() || null,
      health_reminders?.trim() || null,
      JSON.stringify(Array.isArray(family_members) ? family_members : [])
    );

  const elder = db.prepare('SELECT * FROM elders WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(parseElder(elder));
});

router.put('/:id', (req, res) => {
  const existing = getElderForUser(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: '老人资料不存在' });

  const { name, age, relationship, hobbies, health_reminders, family_members } = req.body;

  db.prepare(
    `UPDATE elders SET name = ?, age = ?, relationship = ?, hobbies = ?,
     health_reminders = ?, family_members = ? WHERE id = ? AND user_id = ?`
  ).run(
    name?.trim() || existing.name,
    age ?? existing.age,
    relationship?.trim() ?? existing.relationship,
    hobbies?.trim() ?? existing.hobbies,
    health_reminders?.trim() ?? existing.health_reminders,
    JSON.stringify(
      Array.isArray(family_members)
        ? family_members
        : JSON.parse(existing.family_members || '[]')
    ),
    req.params.id,
    req.user.id
  );

  const elder = getElderForUser(req.params.id, req.user.id);
  res.json(parseElder(elder));
});

router.post('/:id/regenerate-invite-code', (req, res) => {
  const existing = getElderForUser(req.params.id, req.user.id);
  if (!existing) return res.status(404).json({ error: '老人资料不存在' });

  const inviteCode = generateInviteCode();
  db.prepare('UPDATE elders SET invite_code = ? WHERE id = ? AND user_id = ?').run(
    inviteCode,
    req.params.id,
    req.user.id
  );

  const elder = getElderForUser(req.params.id, req.user.id);
  res.json(parseElder(elder));
});

export default router;
