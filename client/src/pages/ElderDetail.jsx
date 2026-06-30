import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';

export default function ElderDetail() {
  const { id } = useParams();
  const [elder, setElder] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [elderData, sessionList] = await Promise.all([
          api.getElder(id),
          api.getElderSessionsDetail(id),
        ]);
        setElder(elderData);
        setSessions(sessionList);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  function copyCode() {
    navigator.clipboard.writeText(elder.invite_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleRegenerate() {
    if (!window.confirm('重新生成后，旧邀请码将失效，需重新告诉老人新数字。确定吗？')) return;
    setRegenerating(true);
    try {
      const updated = await api.regenerateInviteCode(id);
      setElder(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) return <div className="loading">加载中...</div>;
  if (error && !elder) return <div className="error-banner">{error}</div>;
  if (!elder) return null;

  return (
    <div className="page elder-detail-page">
      <div className="page-header">
        <div>
          <Link to="/family" className="back-link">
            ← 返回
          </Link>
          <h1>{elder.name}</h1>
          <p className="subtitle">
            {elder.age ? `${elder.age} 岁` : ''}
            {elder.relationship ? ` · ${elder.relationship}` : ''}
          </p>
        </div>
        <Link to={`/elders/${id}/edit`} className="btn btn-ghost btn-sm">
          编辑资料
        </Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card invite-code-card">
        <h2>老人邀请码</h2>
        <p className="invite-code-hint">请告诉老人输入这个 4 位数字：</p>
        <div className="invite-code-display">{elder.invite_code}</div>
        <div className="invite-code-actions">
          <button type="button" className="btn btn-primary" onClick={copyCode}>
            {copied ? '已复制 ✓' : '复制邀请码'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleRegenerate}
            disabled={regenerating}
          >
            {regenerating ? '生成中...' : '重新生成'}
          </button>
        </div>
        <p className="invite-code-note">
          老人打开首页 → 点「我是老人」→ 输入以上 4 位数字即可进入
        </p>
      </div>

      {elder.hobbies && (
        <div className="card detail-section">
          <h3>爱好</h3>
          <p>{elder.hobbies}</p>
        </div>
      )}

      {elder.health_reminders && (
        <div className="card detail-section">
          <h3>健康提醒</h3>
          <p>{elder.health_reminders}</p>
        </div>
      )}

      {elder.family_members?.length > 0 && (
        <div className="card detail-section">
          <h3>家庭成员</h3>
          <p>{elder.family_members.join('、')}</p>
        </div>
      )}

      <div className="card detail-section">
        <h3>陪伴记录</h3>
        {sessions.length === 0 ? (
          <p className="elder-sub">还没有聊天记录</p>
        ) : (
          <ul className="session-list">
            {sessions.map((s) => (
              <li key={s.id} className="session-list-item">
                <div>
                  <strong>{formatTime(s.ended_at || s.started_at)}</strong>
                  <span className="elder-sub">
                    {' '}
                    · {s.user_message_count || 0} 条发言
                  </span>
                </div>
                {s.summary ? (
                  <Link to={`/sessions/${s.id}/summary`} className="btn btn-secondary btn-sm">
                    查看摘要
                  </Link>
                ) : (
                  <span className="elder-sub">进行中</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="detail-actions">
        <Link to={`/elders/${id}/chat`} className="btn btn-primary">
          我来陪 Ta 聊聊
        </Link>
      </div>
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
