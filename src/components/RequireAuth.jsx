// src/components/RequireAuth.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated  } from '../mock-api/auth.js';

export default function RequireAuth({ children }) {
  const location = useLocation();

<<<<<<< Updated upstream
  if (!isAuthenticated ()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
=======
  if (!isReady) {
    return (
      <div className="page">
        <Loading description="ثانية واحدة…" title="بنحدّد وضعك..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
>>>>>>> Stashed changes
  }

  return children;
}