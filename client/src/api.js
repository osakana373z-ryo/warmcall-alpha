const API_BASE = '/api';
const ADMIN_KEY_STORAGE = 'warmcall_admin_key';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
}

export function getAdminKey() {
  return sessionStorage.getItem(ADMIN_KEY_STORAGE);
}

export function setAdminKey(key) {
  if (key) {
    sessionStorage.setItem(ADMIN_KEY_STORAGE, key);
  } else {
    sessionStorage.removeItem(ADMIN_KEY_STORAGE);
  }
}

async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    if (res.status === 401 && authToken) {
      localStorage.removeItem('warmcall_token');
      localStorage.removeItem('warmcall_user');
      authToken = null;
      window.location.href = '/login';
    }
    const err = new Error(data.error || '请求失败');
    err.status = res.status;
    throw err;
  }

  return data;
}

async function adminRequest(path, options = {}) {
  const adminKey = getAdminKey();
  return request(path, {
    ...options,
    headers: {
      ...options.headers,
      'X-Admin-Key': adminKey || '',
    },
  });
}

export const api = {
  register: (account, password, parentConsent) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ account, password, parent_consent: parentConsent }),
    }),
  login: (account, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ account, password }) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),
  getElders: () => request('/elders'),
  getElder: (id) => request(`/elders/${id}`),
  getElderSessionsDetail: (id) => request(`/elders/${id}/sessions`),
  createElder: (body) => request('/elders', { method: 'POST', body: JSON.stringify(body) }),
  updateElder: (id, body) => request(`/elders/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  regenerateInviteCode: (id) => request(`/elders/${id}/regenerate-invite-code`, { method: 'POST' }),
  startChat: (elderId) => request('/chat/sessions', { method: 'POST', body: JSON.stringify({ elder_id: elderId }) }),
  getSession: (sessionId) => request(`/chat/sessions/${sessionId}`),
  sendMessage: (sessionId, content) =>
    request(`/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  endSession: (sessionId) => request(`/chat/sessions/${sessionId}/end`, { method: 'POST' }),
  getElderSessions: (elderId) => request(`/chat/elders/${elderId}/sessions`),
  bindElder: (inviteCode) =>
    request('/elder-chat/bind', { method: 'POST', body: JSON.stringify({ invite_code: inviteCode }) }),
  getElderInfo: (inviteCode) => request(`/elder-chat/${inviteCode}`),
  elderConsent: (inviteCode) =>
    request(`/elder-chat/${inviteCode}/consent`, {
      method: 'POST',
      body: JSON.stringify({ agreed: true }),
    }),
  submitElderMood: (inviteCode, mood) =>
    request(`/elder-chat/${inviteCode}/mood`, {
      method: 'POST',
      body: JSON.stringify({ mood }),
    }),
  startElderChat: (inviteCode) => request(`/elder-chat/${inviteCode}/sessions`, { method: 'POST' }),
  sendElderMessage: (inviteCode, sessionId, content) =>
    request(`/elder-chat/${inviteCode}/sessions/${sessionId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),
  endElderChat: (inviteCode, sessionId) =>
    request(`/elder-chat/${inviteCode}/sessions/${sessionId}/end`, { method: 'POST' }),
  getAdminStats: () => adminRequest('/admin/stats'),
};
