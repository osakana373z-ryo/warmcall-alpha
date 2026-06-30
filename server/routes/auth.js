import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { JWT_EXPIRES_IN, JWT_SECRET } from '../config.js';
import { requireAuth } from '../middleware/auth.js';
import { detectAccountType, findUserByAccount, normalizeAccount, validatePassword } from '../utils/account.js';

const router = Router();
const SALT_ROUNDS = 10;

function publicUser(row) {
  return {
    id: row.id,
    phone: row.phone,
    email: row.email,
    created_at: row.created_at,
  };
}

function issueToken(user) {
  return jwt.sign(
    { sub: user.id, phone: user.phone, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

router.post('/register', async (req, res) => {
  const account = normalizeAccount(req.body.account);
  const password = req.body.password || '';
  const parentConsent = Boolean(req.body.parent_consent);

  const accountInfo = findUserByAccount(account);
  if (!accountInfo) {
    return res.status(400).json({ error: '请输入有效的手机号或邮箱' });
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return res.status(400).json({ error: passwordError });
  }

  if (!parentConsent) {
    return res.status(400).json({ error: '请先阅读并同意隐私说明' });
  }

  const existing = db
    .prepare(`SELECT id FROM users WHERE ${accountInfo.type} = ?`)
    .get(accountInfo.value);

  if (existing) {
    return res.status(409).json({ error: '该账号已注册，请直接登录' });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const result = db
    .prepare(
      `INSERT INTO users (phone, email, password_hash, parent_consent_at)
       VALUES (?, ?, ?, datetime('now'))`
    )
    .run(
      accountInfo.type === 'phone' ? accountInfo.value : null,
      accountInfo.type === 'email' ? accountInfo.value : null,
      passwordHash
    );

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  const token = issueToken(user);

  res.status(201).json({ token, user: publicUser(user) });
});

router.post('/login', async (req, res) => {
  const account = normalizeAccount(req.body.account);
  const password = req.body.password || '';

  const accountInfo = findUserByAccount(account);
  if (!accountInfo) {
    return res.status(400).json({ error: '请输入有效的手机号或邮箱' });
  }

  if (!password) {
    return res.status(400).json({ error: '请输入密码' });
  }

  const user = db
    .prepare(`SELECT * FROM users WHERE ${accountInfo.type} = ?`)
    .get(accountInfo.value);

  if (!user || !user.password_hash) {
    return res.status(401).json({ error: '账号或密码错误' });
  }

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) {
    return res.status(401).json({ error: '账号或密码错误' });
  }

  const token = issueToken(user);
  res.json({ token, user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', requireAuth, (_req, res) => {
  res.json({ ok: true });
});

export default router;
