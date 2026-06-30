const GREETINGS = [
  '您好呀！今天过得怎么样？有什么想聊的，我都在这儿听着呢。',
  '见到您真高兴！最近身体还好吗？',
  '您好，老朋友！今天天气不错，心情也应该美美的吧？',
];

const TOPICS = {
  health: [
    '身体健康最重要。记得按时吃药、多喝水，有不舒服一定要及时告诉家人哦。',
    '您平时有坚持散步吗？适当活动对身体特别好，但也要注意别太累着自己。',
  ],
  family: [
    '家人一定都很挂念您呢。有空可以给子女打个电话，他们听到您的声音一定会很开心。',
    '有家人陪伴的日子最温暖了。您最近有和家人见面吗？',
  ],
  hobby: [
    '有自己的爱好真好！做喜欢的事情，心情也会跟着亮起来。',
    '听起来很有意思！能多聊聊您平时喜欢做什么吗？',
  ],
  mood: [
    '有时候心里有事，说出来会轻松很多。我一直在这儿陪着您。',
    '每个人都会有情绪低落的时候，这很正常。您已经做得很好了。',
  ],
  default: [
    '嗯嗯，我在认真听您说。能再多告诉我一些吗？',
    '您说得真好。能和您聊天，我也觉得很温暖。',
    '我明白了。您还有什么想聊的，尽管说，不用着急。',
    '谢谢您愿意和我分享这些，这对我们彼此都很珍贵。',
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function detectTopic(text) {
  const lower = text.toLowerCase();
  if (/身体|健康|药|疼|痛|医院|血压|血糖|睡眠|失眠/.test(text)) return 'health';
  if (/儿子|女儿|孩子|孙子|家人|老伴|老公|老婆|子女/.test(text)) return 'family';
  if (/喜欢|爱好|下棋|太极|跳舞|唱歌|养花|看书|电视/.test(text)) return 'hobby';
  if (/孤独|难过|开心|烦|想|寂寞|无聊|心情/.test(text)) return 'mood';
  if (/你好|您好|早上好|下午好|晚上好|hello/.test(lower)) return 'greeting';
  return 'default';
}

export function generateMockReply(userMessage, elderContext = {}) {
  const topic = detectTopic(userMessage);

  if (topic === 'greeting') {
    let reply = pickRandom(GREETINGS);
    if (elderContext.name) {
      reply = `${elderContext.name}，${reply}`;
    }
    return reply;
  }

  let reply = pickRandom(TOPICS[topic] || TOPICS.default);

  if (elderContext.hobbies && topic === 'hobby') {
    reply += ` 记得您喜欢${elderContext.hobbies}，最近有在做吗？`;
  }

  return reply;
}

export function generateSessionSummary(messages, elderContext = {}) {
  const userMessages = messages.filter((m) => m.role === 'user');
  const topics = new Set();
  const moodNotes = [];

  for (const msg of userMessages) {
    const topic = detectTopic(msg.content);
    if (topic !== 'default' && topic !== 'greeting') {
      topics.add(topic);
    }
    if (topic === 'mood') {
      moodNotes.push(msg.content.slice(0, 40));
    }
  }

  const topicLabels = {
    health: '健康状况',
    family: '家人话题',
    hobby: '兴趣爱好',
    mood: '情绪感受',
  };

  const discussed = [...topics].map((t) => topicLabels[t] || t);

  const name = elderContext.name || '老人';
  const lines = [
    `【${name}的本次陪伴摘要】`,
    '',
    `本次聊天共 ${userMessages.length} 条发言，时长约 ${Math.max(1, Math.ceil(userMessages.length * 0.5))} 分钟。`,
  ];

  if (discussed.length > 0) {
    lines.push(`主要话题：${discussed.join('、')}。`);
  } else {
    lines.push('主要话题：日常寒暄与轻松闲聊。');
  }

  if (moodNotes.length > 0) {
    lines.push(`情绪相关：老人提到了「${moodNotes[0]}${moodNotes[0].length >= 40 ? '…' : ''}」，建议适当关注。`);
  } else {
    lines.push('情绪状态：整体平稳，交流顺畅。');
  }

  if (elderContext.health_reminders) {
    lines.push(`健康提醒备忘：${elderContext.health_reminders}`);
  }

  lines.push('');
  lines.push('建议：抽空打个电话问候一下，聊聊今天聊过的话题，会让老人感到更温暖。');

  return lines.join('\n');
}
