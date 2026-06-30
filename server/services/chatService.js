import db from '../db.js';
import { generateReply, generateSessionSummary, extractMemory } from './aiService.js';

export function toElderContext(row) {
  if (!row) return null;
  return {
    name: row.name,
    age: row.age,
    hobbies: row.hobbies,
    health_reminders: row.health_reminders,
    relationship: row.relationship,
  };
}

export function getSessionMessages(sessionId) {
  return db
    .prepare('SELECT role, content FROM chat_messages WHERE session_id = ? ORDER BY id')
    .all(sessionId);
}

export async function startChatSession(elderId, elderRow) {
  const result = db.prepare('INSERT INTO chat_sessions (elder_id) VALUES (?)').run(elderId);
  const session = db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(result.lastInsertRowid);

  const elderContext = toElderContext(elderRow);
  const welcome = await generateReply('你好', elderContext, []);

  db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(
    session.id,
    'assistant',
    welcome
  );

  return {
    ...session,
    messages: [{ role: 'assistant', content: welcome }],
  };
}

export async function sendChatMessage(sessionId, content, elderRow) {
  const trimmed = content.trim();

  db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(
    sessionId,
    'user',
    trimmed
  );

  const history = getSessionMessages(sessionId);
  const elderContext = toElderContext(elderRow);
  const reply = await generateReply(trimmed, elderContext, history);

  db.prepare('INSERT INTO chat_messages (session_id, role, content) VALUES (?, ?, ?)').run(
    sessionId,
    'assistant',
    reply
  );

  return {
    userMessage: { role: 'user', content: trimmed },
    assistantMessage: { role: 'assistant', content: reply },
  };
}

export async function endChatSession(sessionId, elderRow) {
  const messages = getSessionMessages(sessionId);
  const elderContext = toElderContext(elderRow);
  const summary = await generateSessionSummary(messages, elderContext);

  db.prepare(`UPDATE chat_sessions SET ended_at = datetime('now'), summary = ? WHERE id = ?`).run(
    summary,
    sessionId
  );

  const memory = await extractMemory(messages, elderContext);
  if (memory) {
    db.prepare(
      'INSERT INTO memories (elder_id, session_id, content) VALUES (?, ?, ?)'
    ).run(elderRow.id, sessionId, memory);
  }

  return db.prepare('SELECT * FROM chat_sessions WHERE id = ?').get(sessionId);
}
