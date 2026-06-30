import { AI_API_BASE_URL, AI_API_KEY, AI_MODEL } from '../config.js';
import { generateMockReply, generateSessionSummary as generateMockSummary } from './mockAi.js';

const SYSTEM_PROMPT = `你是 WarmCall 的温暖陪伴助手，专门为老年人提供耐心、温柔的文字陪伴。
你的语气要亲切、缓慢、尊重，像一位贴心的晚辈或老朋友。
不要给医疗诊断，不要吓唬对方，遇到健康问题建议联系家人或医生。
回复控制在 80 字以内，用简单易懂的中文。`;

function buildElderProfile(elderContext = {}) {
  const parts = [];
  if (elderContext.name) parts.push(`称呼：${elderContext.name}`);
  if (elderContext.age) parts.push(`年龄：${elderContext.age}岁`);
  if (elderContext.relationship) parts.push(`与子女关系：${elderContext.relationship}`);
  if (elderContext.hobbies) parts.push(`爱好：${elderContext.hobbies}`);
  if (elderContext.health_reminders) parts.push(`健康提醒：${elderContext.health_reminders}`);
  return parts.length ? parts.join('；') : '暂无详细档案';
}

async function callChatCompletion(messages) {
  const res = await fetch(`${AI_API_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      temperature: 0.8,
      max_tokens: 200,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API error: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || '';
}

export async function generateReply(userMessage, elderContext = {}, messageHistory = []) {
  if (!AI_API_KEY) {
    return generateMockReply(userMessage, elderContext);
  }

  try {
    const history = messageHistory.slice(-8).map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const messages = [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\n老人档案：${buildElderProfile(elderContext)}`,
      },
      ...history,
      { role: 'user', content: userMessage },
    ];

    const reply = await callChatCompletion(messages);
    return reply || generateMockReply(userMessage, elderContext);
  } catch (err) {
    console.error('[aiService] generateReply fallback:', err.message);
    return generateMockReply(userMessage, elderContext);
  }
}

export async function generateSessionSummary(messages, elderContext = {}) {
  if (!AI_API_KEY) {
    return generateMockSummary(messages, elderContext);
  }

  try {
    const transcript = messages
      .filter((m) => m.role === 'user')
      .map((m, i) => `${i + 1}. ${m.content}`)
      .join('\n');

    const summaryMessages = [
      {
        role: 'system',
        content: `你是 WarmCall 的子女端摘要助手。根据老人聊天记录，生成温暖、简洁的摘要给子女看。
格式：
【XX的本次陪伴摘要】
（空行）
本次聊天概况（发言数、主要话题）
情绪状态（平稳/需关注，语气积极）
健康相关提醒（如有）
（空行）
给子女的一条温馨建议
不要编造未提及的内容，不要展示恐吓性措辞。`,
      },
      {
        role: 'user',
        content: `老人：${elderContext.name || '老人'}
档案：${buildElderProfile(elderContext)}

老人发言记录：
${transcript || '（本次几乎只有寒暄）'}`,
      },
    ];

    const summary = await callChatCompletion(summaryMessages);
    return summary || generateMockSummary(messages, elderContext);
  } catch (err) {
    console.error('[aiService] generateSessionSummary fallback:', err.message);
    return generateMockSummary(messages, elderContext);
  }
}

export async function extractMemory(messages, elderContext = {}) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return null;

  if (!AI_API_KEY) {
    const snippet = lastUser.content.slice(0, 60);
    return `${elderContext.name || '老人'}曾提到：${snippet}`;
  }

  try {
    const reply = await callChatCompletion([
      {
        role: 'system',
        content: '用一句话（不超过40字）概括老人本次聊天最值得记住的信息，供下次陪伴参考。语气中性温暖。',
      },
      {
        role: 'user',
        content: messages
          .filter((m) => m.role === 'user')
          .map((m) => m.content)
          .join('\n'),
      },
    ]);
    return reply || null;
  } catch {
    return null;
  }
}
