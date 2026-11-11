// src/components/RequireAuth.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { isAuthenticated  } from '../mock-api/auth.js';

export default function RequireAuth({ children }) {
  const location = useLocation();

  if (!isAuthenticated ()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}