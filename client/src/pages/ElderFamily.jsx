import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import ElderGuard from '../components/ElderGuard';
import { getElderInviteCode, getElderName } from '../utils/elderSession';

export default function ElderFamily() {
  const inviteCode = getElderInviteCode();
  const name = getElderName();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getElderInfo(inviteCode)
      .then((info) => setMembers(info.family_members || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [inviteCode]);

  if (loading) return <div className="loading elder-loading">加载中...</div>;

  return (
    <ElderGuard>
      <div className="page elder-family-page">
        <Link to="/elder/home" className="elder-back-link">
          ← 回首页
        </Link>

        <header className="elder-home-header">
          <div className="elder-home-btn-icon">👨‍👩‍👧</div>
          <h1>您的家人</h1>
          <p>{name ? `${name}，他们都很挂念您` : '家人都在想着您'}</p>
        </header>

        {error && <div className="error-banner elder-error">{error}</div>}

        <div className="elder-family-list">
          {members.length === 0 ? (
            <div className="card elder-family-empty">
              <p>家人信息还没填</p>
              <p className="elder-sub">可以让子女帮您补充</p>
            </div>
          ) : (
            members.map((member) => (
              <div key={member} className="card elder-family-card">
                <span className="elder-family-avatar">{member.charAt(0)}</span>
                <span className="elder-family-name">{member}</span>
              </div>
            ))
          )}
        </div>

        <Link to="/elder/home" className="btn btn-primary btn-elder btn-block elder-page-back">
          回首页
        </Link>
      </div>
    </ElderGuard>
  );
}
