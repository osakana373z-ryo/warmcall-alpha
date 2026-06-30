import { Link } from 'react-router-dom';
import ElderGuard from '../components/ElderGuard';
import { clearElderSession, getElderName } from '../utils/elderSession';

export default function ElderHome() {
  const name = getElderName();

  function handleExit() {
    clearElderSession();
    window.location.href = '/';
  }

  return (
    <ElderGuard>
      <div className="page elder-home-page">
        <header className="elder-home-header">
          <div className="elder-home-sun">☀️</div>
          <h1>{name ? `${name}，您好` : '您好'}</h1>
          <p>今天想做什么？</p>
        </header>

        <nav className="elder-home-nav" aria-label="老人主页">
          <Link to="/elder/chat" className="elder-home-btn">
            <span className="elder-home-btn-icon">🎤</span>
            <span className="elder-home-btn-text">开始聊天</span>
          </Link>

          <Link to="/elder/family" className="elder-home-btn">
            <span className="elder-home-btn-icon">👨‍👩‍👧</span>
            <span className="elder-home-btn-text">看看家人</span>
          </Link>

          <Link to="/elder/mood" className="elder-home-btn">
            <span className="elder-home-btn-icon">❤️</span>
            <span className="elder-home-btn-text">今日心情</span>
          </Link>
        </nav>

        <button type="button" className="elder-exit-btn" onClick={handleExit}>
          退出
        </button>
      </div>
    </ElderGuard>
  );
}
