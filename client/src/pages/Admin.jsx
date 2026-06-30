import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getAdminKey, setAdminKey } from '../api';

const DEV_ADMIN_KEY = 'warmcall-admin';

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(Boolean(getAdminKey()));
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!authenticated) return;

    setLoading(true);
    api
      .getAdminStats()
      .then(setStats)
      .catch((err) => {
        if (err.status === 403) {
          setAdminKey(null);
          setAuthenticated(false);
          setError('管理员密钥无效，请重新输入');
        } else {
          setError(err.message);
        }
      })
      .finally(() => setLoading(false));
  }, [authenticated]);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setAdminKey(keyInput.trim());
    setAuthenticated(true);
  }

  function handleLogout() {
    setAdminKey(null);
    setAuthenticated(false);
    setStats(null);
    setKeyInput('');
  }

  if (!authenticated) {
    return (
      <div className="page admin-page">
        <div className="login-card card">
          <div className="login-header">
            <div className="login-icon">🛠️</div>
            <h1>开发者后台</h1>
            <p className="subtitle">WarmCall 运营数据概览</p>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="admin-key">管理员密钥</label>
              <input
                id="admin-key"
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="请输入管理员密钥"
                required
                autoFocus
              />
              <p className="form-hint">
                演示环境密钥：<strong>{DEV_ADMIN_KEY}</strong>
              </p>
            </div>
            <button type="submit" className="btn btn-primary btn-block">
              进入后台
            </button>
          </form>

          <Link to="/" className="btn btn-ghost btn-block login-back">
            返回用户端
          </Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="loading">加载运营数据...</div>;
  if (error && !stats) return <div className="error-banner">{error}</div>;

  const { overview, users } = stats || { overview: {}, users: [] };

  return (
    <div className="page admin-page admin-dashboard">
      <div className="page-header">
        <div>
          <h1>开发者后台</h1>
          <p className="subtitle">运营统计数据（不含完整聊天内容）</p>
        </div>
        <div className="admin-header-actions">
          <Link to="/" className="btn btn-ghost btn-sm">
            用户端
          </Link>
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
            退出后台
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-value">{overview.total_users ?? 0}</div>
          <div className="stat-label">注册用户</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value">{overview.total_elders ?? 0}</div>
          <div className="stat-label">老人档案</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value">{overview.total_sessions ?? 0}</div>
          <div className="stat-label">聊天次数</div>
        </div>
        <div className="stat-card card">
          <div className="stat-value">{overview.total_summaries ?? 0}</div>
          <div className="stat-label">摘要数量</div>
        </div>
      </div>

      {overview.last_activity_at && (
        <p className="admin-last-activity">
          全站最近活跃：{formatTime(overview.last_activity_at)}
          {overview.total_memories != null && ` · 记忆条目 ${overview.total_memories}`}
        </p>
      )}

      {users.length === 0 ? (
        <div className="empty-state card">
          <p>暂无用户数据</p>
        </div>
      ) : (
        users.map((user) => (
          <div key={user.id} className="admin-user-block card">
            <div className="admin-user-header">
              <div>
                <h2>{user.phone || user.email || `用户 ${user.id}`}</h2>
                <p className="admin-meta">
                  用户 ID {user.id} · 注册于 {formatTime(user.created_at)} ·{' '}
                  <strong>{user.elder_count}</strong> 位老人档案
                </p>
              </div>
            </div>

            {user.elders.length === 0 ? (
              <p className="admin-empty">该用户尚未创建老人档案</p>
            ) : (
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>老人</th>
                      <th>关系</th>
                      <th>聊天次数</th>
                      <th>摘要数量</th>
                      <th>最近聊天</th>
                    </tr>
                  </thead>
                  <tbody>
                    {user.elders.map((elder) => (
                      <tr key={elder.id}>
                        <td>
                          <strong>{elder.name}</strong>
                          {elder.age ? <span className="admin-sub"> · {elder.age} 岁</span> : null}
                        </td>
                        <td>{elder.relationship || '—'}</td>
                        <td>{elder.chat_count}</td>
                        <td>{elder.summary_count}</td>
                        <td>{elder.last_chat_at ? formatTime(elder.last_chat_at) : '暂无'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso.includes('T') ? iso : iso.replace(' ', 'T') + 'Z');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
