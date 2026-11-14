<<<<<<< Updated upstream
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import InstructorView from './pages/InstructorView.jsx';
import StudentView from './pages/StudentView.jsx';
import Loading from './components/ui/Loading.jsx';
import RequireAuth from './components/RequireAuth.jsx';
=======
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
>>>>>>> Stashed changes

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
<<<<<<< Updated upstream

      <Route path="/instructor-dashboard" element={
          <RequireAuth>
            <InstructorView />
          </RequireAuth>
        }
      />
      <Route path="/student-dashboard" element={<StudentView />} />
      <Route path="/dashboard" element={<div className="page"><Loading title={"صفحه الطالب"} description={"قيد الانشاء"} /></div>} />

      <Route path="*" element={<Navigate to="/" replace />} />
=======
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
>>>>>>> Stashed changes
    </Routes>
  );
}

export default App;