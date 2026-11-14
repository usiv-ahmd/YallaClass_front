// src/components/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth.store.jsx";
import Loading from "./ui/Loading.jsx";

export default function RequireAuth({ children }) {
  const location = useLocation();
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return (
      <div className="page">
        <Loading description="ثانية واحدة…" title="بنحدّد وضعك..." />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />;
  }

  return children;
}