import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import InstructorView from './pages/InstructorView.jsx';
import StudentView from './pages/StudentView.jsx';
import Loading from './components/ui/Loading.jsx';
import RequireAuth from './components/RequireAuth.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      <Route path="/instructor-dashboard" element={
          <RequireAuth>
            <InstructorView />
          </RequireAuth>
        }
      />
      <Route path="/student-dashboard" element={<StudentView />} />
      <Route path="/dashboard" element={<div className="page"><Loading title={"صفحه الطالب"} description={"قيد الانشاء"} /></div>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;