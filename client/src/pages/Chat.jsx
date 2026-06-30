import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';

export default function Chat() {
  const { id: elderId } = useParams();
  const navigate = useNavigate();

  const [elder, setElder] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function init() {
      try {
        const elderData = await api.getElder(elderId);
        setElder(elderData);

        const session = await api.startChat(elderId);
        setSessionId(session.id);
        setMessages(session.messages || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [elderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim() || sending || !sessionId) return;

    const text = input.trim();
    setInput('');
    setSending(true);
    setError('');

    setMessages((prev) => [...prev, { role: 'user', content: text }]);

    try {
      const { assistantMessage } = await api.sendMessage(sessionId, text);
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err.message);
      setMessages((prev) => prev.slice(0, -1));
      setInput(text);
    } finally {
      setSending(false);
    }
  }

  async function handleEndChat() {
    if (!sessionId || ending) return;
    setEnding(true);
    setError('');

    try {
      const session = await api.endSession(sessionId);
      navigate(`/sessions/${session.id}/summary`, { state: { elder } });
    } catch (err) {
      setError(err.message);
      setEnding(false);
    }
  }

  if (loading) return <div className="loading">正在准备聊天...</div>;

  return (
    <div className="page chat-page">
      <div className="chat-header card">
        <div>
          <Link to="/family" className="back-link">← 返回</Link>
          <h1>与 {elder?.name} 的温暖陪伴</h1>
          <p className="subtitle">轻松聊聊，有人倾听</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleEndChat}
          disabled={ending || messages.length < 2}
        >
          {ending ? '生成摘要中...' : '结束聊天'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="chat-container card">
        <div className="chat-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`message message-${msg.role}`}>
              <div className="message-avatar">
                {msg.role === 'user' ? elder?.name?.charAt(0) || '我' : '☀️'}
              </div>
              <div className="message-bubble">{msg.content}</div>
            </div>
          ))}
          {sending && (
            <div className="message message-assistant">
              <div className="message-avatar">☀️</div>
              <div className="message-bubble typing">正在思考...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className="chat-input" onSubmit={handleSend}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="说点什么吧..."
            disabled={sending || ending}
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={!input.trim() || sending}>
            发送
          </button>
        </form>
      </div>
    </div>
  );
}
