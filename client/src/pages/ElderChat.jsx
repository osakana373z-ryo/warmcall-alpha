import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ElderGuard from '../components/ElderGuard';
import { mockVoiceTranscribe } from '../services/voiceService';
import { getElderInviteCode, getElderName } from '../utils/elderSession';

const QUICK_PHRASES = [
  { icon: '😊', text: '我今天挺好的' },
  { icon: '💭', text: '有点想家人' },
  { icon: '🌤️', text: '天气不错，心情也好' },
  { icon: '💊', text: '药已经吃了' },
];

export default function ElderChat() {
  const inviteCode = getElderInviteCode();
  const elderName = getElderName();

  const [needsConsent, setNeedsConsent] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [ended, setEnded] = useState(false);
  const [error, setError] = useState('');
  const [holding, setHolding] = useState(false);
  const [voiceHint, setVoiceHint] = useState('');

  const startedRef = useRef(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    api
      .getElderInfo(inviteCode)
      .then((info) => setNeedsConsent(!info.elder_consent_at))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [inviteCode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleConsent() {
    setError('');
    try {
      await api.elderConsent(inviteCode);
      setNeedsConsent(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function beginChat() {
    if (startedRef.current) return;
    startedRef.current = true;
    try {
      const session = await api.startElderChat(inviteCode);
      setSessionId(session.id);
      setMessages(session.messages || []);
    } catch (err) {
      startedRef.current = false;
      setError(err.message);
    }
  }

  async function sendText(text) {
    if (!text.trim() || sending || !sessionId || ended) return;

    setSending(true);
    setError('');
    setMessages((prev) => [...prev, { role: 'user', content: text.trim() }]);

    try {
      const { assistantMessage } = await api.sendElderMessage(inviteCode, sessionId, text.trim());
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
      setVoiceHint('');
    }
  }

  async function handleVoiceStart() {
    setHolding(true);
    setVoiceHint('正在听您说...');
  }

  async function handleVoiceEnd() {
    if (!holding) return;
    setHolding(false);
    const text = await mockVoiceTranscribe();
    setVoiceHint(`您说：${text}`);
    await sendText(text);
  }

  async function handleEnd() {
    if (!sessionId || ending) return;
    setEnding(true);
    try {
      await api.endElderChat(inviteCode, sessionId);
      setEnded(true);
      startedRef.current = false;
    } catch (err) {
      setError(err.message);
    } finally {
      setEnding(false);
    }
  }

  if (loading) return <div className="loading elder-loading">正在准备...</div>;

  return (
    <ElderGuard>
      <div className="page elder-chat-page">
        <Link to="/elder/home" className="elder-back-link">
          ← 回首页
        </Link>

        <header className="elder-chat-header">
          <h1>{elderName ? `${elderName}，聊天` : '温暖聊天'}</h1>
          <p>慢慢说，我听着呢</p>
        </header>

        {needsConsent ? (
          <div className="card elder-consent-card">
            <h2>开始之前</h2>
            <p>这是一次温暖的陪伴聊天，您可以放心说话。</p>
            <p>聊完后，家人会收到一份<strong>简短的近况摘要</strong>，方便关心您。</p>
            {error && <div className="error-banner">{error}</div>}
            <button type="button" className="btn btn-primary btn-elder btn-block" onClick={handleConsent}>
              我知道了
            </button>
          </div>
        ) : ended ? (
          <div className="card elder-ended-card">
            <div className="elder-ended-icon">💛</div>
            <h2>聊完了，真好</h2>
            <p>家人会收到一份温暖摘要。</p>
            <Link to="/elder/home" className="btn btn-primary btn-elder btn-block">
              回首页
            </Link>
          </div>
        ) : !sessionId ? (
          <div className="card elder-start-card">
            <div className="elder-start-icon">🎤</div>
            <p>准备好了吗？</p>
            <button type="button" className="btn btn-primary btn-elder btn-block" onClick={beginChat}>
              开始聊天
            </button>
          </div>
        ) : (
          <>
            {error && <div className="error-banner elder-error">{error}</div>}

            <div className="elder-chat-container card">
              <div className="elder-chat-messages">
                {messages.map((msg, i) => (
                  <div key={i} className={`elder-message elder-message-${msg.role}`}>
                    <div className="elder-message-bubble">{msg.content}</div>
                  </div>
                ))}
                {sending && (
                  <div className="elder-message elder-message-assistant">
                    <div className="elder-message-bubble typing">正在想怎么回您...</div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="elder-voice-area">
                {voiceHint && <p className="elder-voice-hint">{voiceHint}</p>}

                <button
                  type="button"
                  className={`elder-voice-btn ${holding ? 'holding' : ''}`}
                  onMouseDown={handleVoiceStart}
                  onMouseUp={handleVoiceEnd}
                  onMouseLeave={() => holding && handleVoiceEnd()}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleVoiceStart();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleVoiceEnd();
                  }}
                  disabled={sending || ending}
                >
                  <span className="elder-voice-btn-icon">🎤</span>
                  <span>{holding ? '松开结束' : '按住说话'}</span>
                </button>

                <div className="elder-quick-phrases">
                  {QUICK_PHRASES.map((p) => (
                    <button
                      key={p.text}
                      type="button"
                      className="elder-quick-btn"
                      onClick={() => sendText(p.text)}
                      disabled={sending || ending}
                    >
                      <span>{p.icon}</span>
                      <span>{p.text}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="elder-chat-end-wrap">
                <button
                  type="button"
                  className="btn btn-secondary btn-elder-end"
                  onClick={handleEnd}
                  disabled={ending || messages.length < 2}
                >
                  {ending ? '结束中...' : '结束聊天'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </ElderGuard>
  );
}
