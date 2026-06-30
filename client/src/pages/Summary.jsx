import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../api';

export default function Summary() {
  const { sessionId } = useParams();
  const location = useLocation();
  const elderFromState = location.state?.elder;

  const [session, setSession] = useState(null);
  const [elder, setElder] = useState(elderFromState || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const sessionData = await api.getSession(sessionId);
        setSession(sessionData);

        if (!elderFromState) {
          const elderData = await api.getElder(sessionData.elder_id);
          setElder(elderData);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId, elderFromState]);

  if (loading) return <div className="loading">加载摘要...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div className="page summary-page">
      <div className="page-header">
        <div>
          <h1>陪伴摘要</h1>
          <p className="subtitle">
            给子女看的本次聊天报告 · {elder?.name}
          </p>
        </div>
      </div>

      <div className="card summary-card">
        <div className="summary-meta">
          <span>开始：{formatTime(session?.started_at)}</span>
          <span>结束：{formatTime(session?.ended_at)}</span>
        </div>

        <div className="summary-content">
          {session?.summary?.split('\n').map((line, i) => (
            <p key={i}>{line || '\u00A0'}</p>
          ))}
        </div>
      </div>

      <div className="summary-actions">
        <Link to="/family" className="btn btn-primary">
          返回首页
        </Link>
        {elder && (
          <Link to={`/elders/${elder.id}/chat`} className="btn btn-ghost">
            再次陪伴聊天
          </Link>
        )}
      </div>
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return '-';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
