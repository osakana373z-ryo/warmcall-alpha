const ELDER_INVITE_KEY = 'warmcall_elder_invite';
const ELDER_NAME_KEY = 'warmcall_elder_name';

export function getElderInviteCode() {
  return localStorage.getItem(ELDER_INVITE_KEY);
}

export function setElderSession(inviteCode, name) {
  localStorage.setItem(ELDER_INVITE_KEY, inviteCode);
  if (name) localStorage.setItem(ELDER_NAME_KEY, name);
}

export function getElderName() {
  return localStorage.getItem(ELDER_NAME_KEY) || '';
}

export function clearElderSession() {
  localStorage.removeItem(ELDER_INVITE_KEY);
  localStorage.removeItem(ELDER_NAME_KEY);
}
