import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [parentConsent, setParentConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <div className="loading">加载中...</div>;
  if (isAuthenticated) return <Navigate to="/family" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('两次输入的密码不一致');
      return;
    }

    if (!parentConsent) {
      setError('请先阅读并同意隐私说明');
      return;
    }

    setSubmitting(true);
    try {
      await register(account.trim(), password, parentConsent);
      navigate('/family');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page login-page">
      <div className="login-card card">
        <div className="login-header">
          <div className="login-icon">🤝</div>
          <h1>创建账号</h1>
          <p className="subtitle">加入 WarmCall，为家人开启温暖陪伴</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="account">手机号或邮箱</label>
            <input
              id="account"
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="用于登录"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位"
              minLength={6}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm">确认密码</label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <label className="consent-checkbox">
            <input
              type="checkbox"
              checked={parentConsent}
              onChange={(e) => setParentConsent(e.target.checked)}
            />
            <span>
              我已阅读并同意
              <Link to="/privacy" target="_blank" rel="noreferrer">
                《隐私与数据使用说明》
              </Link>
            </span>
          </label>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? '注册中...' : '注册并登录'}
          </button>
        </form>

        <p className="auth-switch">
          已有账号？<Link to="/login">去登录</Link>
        </p>
      </div>
    </div>
  );
}
