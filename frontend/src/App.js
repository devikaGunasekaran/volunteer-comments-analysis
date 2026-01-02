import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import StudentsAssignPage from './pages/volunteer/StudentsAssignPage';
import StudentDetailsPage from './pages/volunteer/StudentDetailsPage';
import PVFormPage from './pages/volunteer/PVFormPage';
import AdminAssignPage from './pages/admin/AdminAssignPage';
import AdminViewPage from './pages/admin/AdminViewPage';
import TVStudentsPage from './pages/tv_volunteer/TVStudentsPage';
import TVStudentDetailsPage from './pages/tv_volunteer/TVStudentDetailsPage';
import TVFormPage from './pages/tv_volunteer/TVFormPage';
import TVAssignmentPage from './pages/admin/TVAssignmentPage';
import TVReportsReviewPage from './pages/admin/TVReportsReviewPage';
import TVReportDetailsPage from './pages/admin/TVReportDetailsPage';
import TVAdminDashboard from './pages/admin/TVAdminDashboard';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Auth Routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Volunteer Routes */}
          <Route path="/students-assign" element={<StudentsAssignPage />} />
          <Route path="/student/:studentId" element={<StudentDetailsPage />} />
          <Route path="/pv/:studentId" element={<PVFormPage />} />

          {/* Admin Routes */}
          <Route path="/admin/assign" element={<AdminAssignPage />} />
          <Route path="/admin/dashboard" element={<Navigate to="/admin/assign" replace />} />
          <Route path="/admin/view/:studentId" element={<AdminViewPage />} />
          <Route path="/admin/tv-dashboard" element={<TVAdminDashboard />} />
          <Route path="/admin/tv-assignment" element={<TVAssignmentPage />} />
          <Route path="/admin/tv-reports" element={<TVReportsReviewPage />} />
          <Route path="/admin/tv-report/:studentId" element={<TVReportDetailsPage />} />

          {/* TV Volunteer Routes */}
          <Route path="/tv/students" element={<TVStudentsPage />} />
          <Route path="/tv/student/:studentId" element={<TVStudentDetailsPage />} />
          <Route path="/tv/form/:studentId" element={<TVFormPage />} />
          <Route path="/tv-volunteer" element={<Navigate to="/tv/students" replace />} />

          {/* Redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
