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

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/instructor-dashboard" element={<RequireAuth><InstructorMainPage /></RequireAuth>} />
      <Route path="/organization" element={<RequireAuth><OrganizationPage /></RequireAuth>} />
      <Route path="/library" element={<RequireAuth><QuizLibraryPage /></RequireAuth>} />
      <Route path="/library/:quizId" element={<RequireAuth><QuizEditorPage /></RequireAuth>} />
      <Route path="/reports/:sessionId" element={<RequireAuth><SessionReportPage /></RequireAuth>} />
      <Route path="/sessions" element={<RequireAuth><SessionsPage /></RequireAuth>} />
      <Route path="/sessions/:sessionId" element={<RequireAuth><SessionDetailPage /></RequireAuth>} />
      <Route path="/join" element={<StudentJoinPage />} />
      <Route path="/join/:sessionId" element={<StudentSessionPage />} />
      <Route path="/student-dashboard" element={<Navigate replace to="/join" />} />
      <Route path="/dashboard" element={<div className="page"><Loading description={"قيد الانشاء"} title={"صفحه الطالب"} /></div>} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}

export default App;