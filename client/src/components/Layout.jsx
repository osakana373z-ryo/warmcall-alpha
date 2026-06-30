import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function maskPhone(phone) {
  if (!phone || phone.length < 11) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

function displayAccount(user) {
  if (user?.phone) return maskPhone(user.phone);
  if (user?.email) {
    const [name, domain] = user.email.split('@');
    return `${name.slice(0, 2)}***@${domain}`;
  }
  return '已登录';
}

export default function Layout({ children }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isElderFlow = location.pathname.startsWith('/elder');
  const isWelcome = location.pathname === '/';

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  if (isElderFlow) {
    return <div className="app elder-app">{children}</div>;
  }

  if (isWelcome) {
    return <div className="app welcome-app">{children}</div>;
  }

  return (
    <div className="app">
      <header className="header">
        <Link to={isAuthenticated ? '/family' : '/'} className="logo">
          <span className="logo-icon">☀️</span>
          <span className="logo-text">WarmCall</span>
          <span className="logo-tagline">温暖陪伴</span>
        </Link>
        {isAuthenticated && (
          <div className="header-user">
            <span className="user-phone">{displayAccount(user)}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
              退出
            </button>
          </div>
        )}
      </header>
      <main className="main">{children}</main>
      <footer className="footer">
        <p>用科技传递温暖，让陪伴不再遥远</p>
        <Link to="/admin" className="footer-admin-link">
          开发者后台
        </Link>
      </footer>
    </div>
  );
}
