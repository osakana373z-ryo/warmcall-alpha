import { Navigate } from 'react-router-dom';
import { getElderInviteCode } from '../utils/elderSession';

export default function ElderGuard({ children }) {
  const code = getElderInviteCode();
  if (!code) {
    return <Navigate to="/elder/bind" replace />;
  }
  return children;
}
