import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Welcome() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  function handleFamily() {
    if (isAuthenticated) {
      navigate('/family');
    } else {
      navigate('/login', { state: { from: '/family' } });
    }
  }

  return (
    <div className="page welcome-page">
      <div className="welcome-hero">
        <div className="welcome-sun">☀️</div>
        <h1>WarmCall</h1>
        <p className="welcome-tagline">温暖陪伴，随时有人在</p>
      </div>

      <div className="welcome-cards">
        <Link to="/elder/bind" className="welcome-card welcome-card-elder">
          <span className="welcome-card-icon" aria-hidden="true">
            👵
          </span>
          <span className="welcome-card-title">我是老人</span>
          <span className="welcome-card-hint">点这里开始</span>
        </Link>

        <button type="button" className="welcome-card welcome-card-family" onClick={handleFamily}>
          <span className="welcome-card-icon" aria-hidden="true">
            👨‍👩‍👧
          </span>
          <span className="welcome-card-title">我是家人</span>
          <span className="welcome-card-hint">管理陪伴与摘要</span>
        </button>
      </div>
    </div>
  );
}
