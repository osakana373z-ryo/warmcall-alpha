import { Router } from 'express';
import db from '../db.js';
import { requireAuth, getElderForUser, getSessionForUser } from '../middleware/auth.js';
import { startChatSession, sendChatMessage, endChatSession } from '../services/chatService.js';

const router = Router();

router.use(requireAuth);

router.post('/sessions', async (req, res) => {
  try {
    const { elder_id } = req.body;
    if (!elder_id) return res.status(400).json({ error: '缺少 elder_id' });

    const elder = getElderForUser(elder_id, req.user.id);
    if (!elder) return res.status(404).json({ error: '老人资料不存在' });

    const session = await startChatSession(elder_id, elder);
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建会话失败' });
  }
});

router.get('/sessions/:id', (req, res) => {
  const session = getSessionForUser(req.params.id, req.user.id);
  if (!session) return res.status(404).json({ error: '会话不存在' });

  const messages = db
    .prepare(
      'SELECT id, role, content, created_at FROM chat_messages WHERE session_id = ? ORDER BY id'
    )
    .all(session.id);

  res.json({ ...session, messages });
});

router.post('/sessions/:id/messages', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: '消息内容不能为空' });

    const session = getSessionForUser(req.params.id, req.user.id);
    if (!session) return res.status(404).json({ error: '会话不存在' });
    if (session.ended_at) return res.status(400).json({ error: '会话已结束' });

    const elder = getElderForUser(session.elder_id, req.user.id);
    const result = await sendChatMessage(session.id, content, elder);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '发送消息失败' });
  }
});

router.post('/sessions/:id/end', async (req, res) => {
  try {
    const session = getSessionForUser(req.params.id, req.user.id);
    if (!session) return res.status(404).json({ error: '会话不存在' });
    if (session.ended_at) return res.status(400).json({ error: '会话已结束' });

    const elder = getElderForUser(session.elder_id, req.user.id);
    const updated = await endChatSession(session.id, elder);
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '结束会话失败' });
  }
});

router.get('/elders/:elderId/sessions', (req, res) => {
  const elder = getElderForUser(req.params.elderId, req.user.id);
  if (!elder) return res.status(404).json({ error: '老人资料不存在' });

  const sessions = db
    .prepare(
      `SELECT id, elder_id, started_at, ended_at,
              CASE WHEN summary IS NOT NULL THEN 1 ELSE 0 END AS has_summary
       FROM chat_sessions WHERE elder_id = ?
       ORDER BY COALESCE(ended_at, started_at) DESC`
    )
    .all(req.params.elderId);

  res.json(sessions);
});

export default router;
