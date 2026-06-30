import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Home() {
  const [elders, setElders] = useState([]);
  const [sessionsMap, setSessionsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const elderList = await api.getElders();
        setElders(elderList);

        const map = {};
        await Promise.all(
          elderList.map(async (elder) => {
            const sessions = await api.getElderSessions(elder.id);
            map[elder.id] = sessions;
          })
        );
        setSessionsMap(map);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div className="loading">加载中...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  const totalSummaries = Object.values(sessionsMap)
    .flat()
    .filter((s) => s.has_summary).length;

  return (
    <div className="page home-page">
      <div className="page-header">
        <div>
          <h1>家人档案</h1>
          <p className="subtitle">安心守护，每次陪伴都有温暖摘要</p>
        </div>
        <Link to="/elders/new" className="btn btn-primary">
          + 添加老人资料
        </Link>
      </div>

      {elders.length > 0 && (
        <div className="reassurance-banner card">
          <div className="reassurance-icon">💛</div>
          <div>
            <strong>您已收到 {totalSummaries} 份陪伴摘要</strong>
            <p>每次聊天结束后，我们会为您整理温暖、简洁的近况报告，让您更放心。</p>
          </div>
        </div>
      )}

      {elders.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🤝</div>
          <h2>还没有家人档案</h2>
          <p>添加父母或长辈的资料，开启温暖陪伴之旅</p>
          <Link to="/elders/new" className="btn btn-primary">
            添加第一位家人
          </Link>
        </div>
      ) : (
        <div className="elder-grid">
          {elders.map((elder) => {
            const sessions = sessionsMap[elder.id] || [];
            const summaryCount = sessions.filter((s) => s.has_summary).length;
            const latestSummary = sessions.find((s) => s.has_summary);

            return (
              <div key={elder.id} className="elder-card card">
                <div className="elder-avatar">{elder.name.charAt(0)}</div>
                <div className="elder-info">
                  <h3>{elder.name}</h3>
                  <p className="elder-meta">
                    {elder.age ? `${elder.age} 岁` : '年龄未填'}
                    {elder.relationship ? ` · ${elder.relationship}` : ''}
                  </p>
                  <p className="elder-detail">
                    <span className="label">邀请码</span>{' '}
                    <strong className="invite-code-inline">{elder.invite_code}</strong>
                  </p>
                  <p className="elder-detail">
                    <span className="label">陪伴摘要</span> 已生成 {summaryCount} 份
                    {latestSummary && (
                      <span className="elder-sub">
                        {' '}
                        · 最近 {formatTime(latestSummary.ended_at)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="elder-actions">
                  <Link to={`/elders/${elder.id}`} className="btn btn-primary btn-sm">
                    查看详情与邀请码
                  </Link>
                  {latestSummary && (
                    <Link
                      to={`/sessions/${latestSummary.id}/summary`}
                      className="btn btn-secondary btn-sm"
                    >
                      最新摘要
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso.includes('T') ? iso : `${iso.replace(' ', 'T')}Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
