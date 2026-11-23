// src/components/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { homePathForRole } from "../constants/roles";
import { useAuth } from "../store/auth.store.jsx";
import Loading from "./ui/Loading.jsx";

export default function RequireAuth({ children, roles }) {
  const location = useLocation();
  const { isReady, isAuthenticated, user } = useAuth();

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

  // Hide nothing by only removing navigation links: reject the actual route
  // and send the user to the dashboard that belongs to their backend role.
  if (Array.isArray(roles) && roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate replace to={homePathForRole(user?.role)} />;
  }

  return children;
}
