import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ElderGuard from '../components/ElderGuard';
import { getElderInviteCode } from '../utils/elderSession';

const MOODS = [
  { icon: '😊', label: '开心' },
  { icon: '😌', label: '平静' },
  { icon: '😐', label: '一般' },
  { icon: '😔', label: '有点闷' },
  { icon: '😢', label: '想家人' },
];

export default function ElderMood() {
  const inviteCode = getElderInviteCode();
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleMood(label) {
    setSaving(true);
    setError('');
    try {
      await api.submitElderMood(inviteCode, label);
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ElderGuard>
      <div className="page elder-mood-page">
        <Link to="/elder/home" className="elder-back-link">
          ← 回首页
        </Link>

        <header className="elder-home-header">
          <div className="elder-home-btn-icon">❤️</div>
          <h1>今日心情</h1>
          <p>点一下，告诉家人您今天怎么样</p>
        </header>

        {error && <div className="error-banner elder-error">{error}</div>}

        {done ? (
          <div className="card elder-ended-card">
            <div className="elder-ended-icon">💛</div>
            <h2>记下了</h2>
            <p>家人会知道您今天的心情</p>
            <Link to="/elder/home" className="btn btn-primary btn-elder btn-block">
              回首页
            </Link>
          </div>
        ) : (
          <div className="elder-mood-grid">
            {MOODS.map((m) => (
              <button
                key={m.label}
                type="button"
                className="elder-mood-btn"
                onClick={() => handleMood(m.label)}
                disabled={saving}
              >
                <span className="elder-mood-icon">{m.icon}</span>
                <span className="elder-mood-label">{m.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </ElderGuard>
  );
}
