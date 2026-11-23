// src/app.js
import { Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.jsx";
import Login from "./pages/Login.jsx";
import InstructorMainPage from "./pages/InstructorMainPage.jsx";
import OrganizationPage from "./pages/OrganizationPage.jsx";
import QuizLibraryPage from "./pages/QuizLibraryPage.jsx";
import QuizEditorPage from "./pages/QuizEditorPage.jsx";
import Loading from "./components/ui/Loading.jsx";
import RequireAuth from "./components/RequireAuth.jsx";
import SessionsPage from "./pages/SessionsPage.jsx";
import SessionDetailPage from "./pages/SessionDetailPage.jsx";
import StudentJoinPage from "./pages/StudentJoinPage.jsx";
import StudentSessionPage from "./pages/StudentSessionPage.jsx";
import SessionReportPage from "./pages/SessionReportPage.jsx";
import RosterPage from "./pages/RosterPage.jsx";
import AdminLayout from "./components/admin/AdminLayout.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";
import AdminOrganizationsPage from "./pages/admin/AdminOrganizationsPage.jsx";
import AdminOrganizationDetailPage from "./pages/admin/AdminOrganizationDetailPage.jsx";
import AdminUsersPage from "./pages/admin/AdminUsersPage.jsx";
import { ROLES, STAFF_ROLES } from "./constants/roles.js";

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <RequireAuth roles={[ROLES.ADMIN]}>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="organizations" element={<AdminOrganizationsPage />} />
        <Route path="organizations/:id" element={<AdminOrganizationDetailPage />} />
        <Route path="users" element={<AdminUsersPage />} />
      </Route>

      <Route
        path="/instructor-dashboard"
        element={
          <RequireAuth roles={STAFF_ROLES}>
            <InstructorMainPage />
          </RequireAuth>
        }
      />
      <Route
        path="/organization"
        element={
          <RequireAuth roles={STAFF_ROLES}>
            <OrganizationPage />
          </RequireAuth>
        }
      />
      <Route
        path="/roster"
        element={
          <RequireAuth roles={STAFF_ROLES}>
            <RosterPage />
          </RequireAuth>
        }
      />
      <Route
        path="/library"
        element={
          <RequireAuth roles={STAFF_ROLES}>
            <QuizLibraryPage />
          </RequireAuth>
        }
      />
      <Route
        path="/library/:quizId"
        element={
          <RequireAuth roles={STAFF_ROLES}>
            <QuizEditorPage />
          </RequireAuth>
        }
      />
      <Route
        path="/reports/:sessionId"
        element={
          <RequireAuth roles={STAFF_ROLES}>
            <SessionReportPage />
          </RequireAuth>
        }
      />
      <Route
        path="/sessions"
        element={
          <RequireAuth roles={STAFF_ROLES}>
            <SessionsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/sessions/:sessionId"
        element={
          <RequireAuth roles={STAFF_ROLES}>
            <SessionDetailPage />
          </RequireAuth>
        }
      />

      <Route path="/join" element={<StudentJoinPage />} />
      <Route path="/join/:code" element={<StudentSessionPage />} />
      <Route path="/student-dashboard" element={<Navigate replace to="/join" />} />
      <Route
        path="/dashboard"
        element={
          <div className="page">
            <Loading description={"قيد الانشاء"} title={"صفحه الطالب"} />
          </div>
        }
      />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}

export default App;
