import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Privacy from './pages/Privacy';
import Home from './pages/Home';
import ElderForm from './pages/ElderForm';
import ElderDetail from './pages/ElderDetail';
import Chat from './pages/Chat';
import Summary from './pages/Summary';
import Admin from './pages/Admin';
import ElderBind from './pages/ElderBind';
import ElderHome from './pages/ElderHome';
import ElderChat from './pages/ElderChat';
import ElderFamily from './pages/ElderFamily';
import ElderMood from './pages/ElderMood';

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/admin" element={<Admin />} />

          <Route path="/elder/bind" element={<ElderBind />} />
          <Route path="/elder/home" element={<ElderHome />} />
          <Route path="/elder/chat" element={<ElderChat />} />
          <Route path="/elder/family" element={<ElderFamily />} />
          <Route path="/elder/mood" element={<ElderMood />} />

          <Route
            path="/family"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/elders/new"
            element={
              <ProtectedRoute>
                <ElderForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/elders/:id"
            element={
              <ProtectedRoute>
                <ElderDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/elders/:id/edit"
            element={
              <ProtectedRoute>
                <ElderForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/elders/:id/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/:sessionId/summary"
            element={
              <ProtectedRoute>
                <Summary />
              </ProtectedRoute>
            }
          />

          {/* 旧链接兼容：重定向到欢迎页 */}
          <Route path="/elder-chat/*" element={<Navigate to="/elder/bind" replace />} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
