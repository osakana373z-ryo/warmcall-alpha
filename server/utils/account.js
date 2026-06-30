const PHONE_RE = /^1\d{10}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeAccount(account) {
  return account?.trim() || '';
}

export function detectAccountType(account) {
  if (PHONE_RE.test(account)) return 'phone';
  if (EMAIL_RE.test(account.toLowerCase())) return 'email';
  return null;
}

export function findUserByAccount(account) {
  const type = detectAccountType(account);
  if (!type) return null;
  const value = type === 'email' ? account.toLowerCase() : account;
  return { type, value };
}

export function validatePassword(password) {
  if (!password || password.length < 6) {
    return '密码至少 6 位';
  }
  return null;
}
