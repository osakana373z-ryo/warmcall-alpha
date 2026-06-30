/**
 * 语音功能预留接口
 * 后续可接入 Web Speech API 或云端 STT
 */

const MOCK_PHRASES = [
  '您好，我今天挺好的',
  '有点想念孩子们',
  '想跟您聊聊天',
  '身体还不错',
  '今天心情不错',
];

/** 模拟「按住说话」转文字（Alpha 阶段） */
export async function mockVoiceTranscribe() {
  await delay(600);
  return MOCK_PHRASES[Math.floor(Math.random() * MOCK_PHRASES.length)];
}

/** 预留：真实语音识别 */
export async function transcribeAudio(_audioBlob) {
  // TODO: 接入真实 STT
  return mockVoiceTranscribe();
}

/** 预留：语音合成 AI 回复 */
export async function speakText(_text) {
  // TODO: 接入 TTS
  return false;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
