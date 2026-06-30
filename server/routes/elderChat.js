import { Router } from 'express';
import db from '../db.js';
import { getElderByInviteCode, getSessionForElder } from '../middleware/auth.js';
import { startChatSession, sendChatMessage, endChatSession } from '../services/chatService.js';

const router = Router();

function parseElderPublic(elder) {
  return {
    name: elder.name,
    invite_code: elder.invite_code,
    elder_consent_at: elder.elder_consent_at,
    family_members: elder.family_members ? JSON.parse(elder.family_members) : [],
    hobbies: elder.hobbies,
    relationship: elder.relationship,
  };
}

router.post('/bind', (req, res) => {
  const code = String(req.body.invite_code || '').trim();
  if (!/^\d{4}$/.test(code)) {
    return res.status(400).json({ error: '请输入 4 位数字' });
  }

  const elder = getElderByInviteCode(code);
  if (!elder) return res.status(404).json({ error: '数字不对，请让家人再告诉您一次' });

  res.json(parseElderPublic(elder));
});

router.get('/:inviteCode', (req, res) => {
  const elder = getElderByInviteCode(req.params.inviteCode);
  if (!elder) return res.status(404).json({ error: '邀请码无效' });

  res.json(parseElderPublic(elder));
});

router.post('/:inviteCode/consent', (req, res) => {
  const elder = getElderByInviteCode(req.params.inviteCode);
  if (!elder) return res.status(404).json({ error: '邀请码无效' });

  if (!req.body.agreed) {
    return res.status(400).json({ error: '需要同意后才能开始' });
  }

  db.prepare(`UPDATE elders SET elder_consent_at = datetime('now') WHERE id = ?`).run(elder.id);

  res.json({ ok: true });
});

router.post('/:inviteCode/mood', (req, res) => {
  const elder = getElderByInviteCode(req.params.inviteCode);
  if (!elder) return res.status(404).json({ error: '邀请码无效' });

  const mood = req.body.mood?.trim();
  if (!mood) return res.status(400).json({ error: '请选择心情' });

  db.prepare('INSERT INTO memories (elder_id, content) VALUES (?, ?)').run(
    elder.id,
    `今日心情：${mood}`
  );

  res.json({ ok: true, message: '已记下您的心情' });
});

router.post('/:inviteCode/sessions', async (req, res) => {
  try {
    const elder = getElderByInviteCode(req.params.inviteCode);
    if (!elder) return res.status(404).json({ error: '邀请码无效' });
    if (!elder.elder_consent_at) {
      return res.status(403).json({ error: '请先阅读并同意陪伴说明' });
    }

    const session = await startChatSession(elder.id, elder);
    res.status(201).json(session);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '创建会话失败' });
  }
});

router.post('/:inviteCode/sessions/:id/messages', async (req, res) => {
  try {
    const elder = getElderByInviteCode(req.params.inviteCode);
    if (!elder) return res.status(404).json({ error: '邀请码无效' });
    if (!elder.elder_consent_at) {
      return res.status(403).json({ error: '请先阅读并同意陪伴说明' });
    }

    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: '消息内容不能为空' });

    const session = getSessionForElder(req.params.id, elder.id);
    if (!session) return res.status(404).json({ error: '会话不存在' });
    if (session.ended_at) return res.status(400).json({ error: '会话已结束' });

    const result = await sendChatMessage(session.id, content, elder);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '发送消息失败' });
  }
});

router.post('/:inviteCode/sessions/:id/end', async (req, res) => {
  try {
    const elder = getElderByInviteCode(req.params.inviteCode);
    if (!elder) return res.status(404).json({ error: '邀请码无效' });

    const session = getSessionForElder(req.params.id, elder.id);
    if (!session) return res.status(404).json({ error: '会话不存在' });
    if (session.ended_at) return res.status(400).json({ error: '会话已结束' });

    await endChatSession(session.id, elder);
    res.json({ ok: true, message: '本次陪伴已结束' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '结束会话失败' });
  }
});

export default router;
