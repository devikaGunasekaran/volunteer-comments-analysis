import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import StudentsAssignPage from './pages/volunteer/StudentsAssignPage';
import StudentDetailsPage from './pages/volunteer/StudentDetailsPage';
import PVFormPage from './pages/volunteer/PVFormPage';
import AdminAssignPage from './pages/admin/AdminAssignPage';
import AdminViewPage from './pages/admin/AdminViewPage';
import AdminPVStudentsPage from './pages/admin/AdminPVStudentsPage';
import AdminAssignPVPage from './pages/admin/AdminAssignPVPage';
import SuperadminDashboardPage from './pages/superadmin/SuperadminDashboardPage';
import SuperadminAssignVIPage from './pages/superadmin/SuperadminAssignVIPage';
import SuperadminVIStudentsPage from './pages/superadmin/SuperadminVIStudentsPage';
import SuperadminAssignRealInterviewPage from './pages/superadmin/SuperadminAssignRealInterviewPage';
import SuperadminRealInterviewStudentsPage from './pages/superadmin/SuperadminRealInterviewStudentsPage';
import VIVolunteerDashboardPage from './pages/vi/VIVolunteerDashboardPage';
import VIInterviewFormPage from './pages/vi/VIInterviewFormPage';
import VICompletedInterviewsPage from './pages/vi/VICompletedInterviewsPage';
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
          <Route path="/admin/decision/:studentId" element={<AdminViewPage />} />
          <Route path="/admin/pv-students" element={<AdminPVStudentsPage />} />
          <Route path="/admin/assign-pv" element={<AdminAssignPVPage />} />

          {/* Superadmin Routes */}
          <Route path="/superadmin/dashboard" element={<SuperadminDashboardPage />} />
          <Route path="/superadmin/assign-vi" element={<SuperadminAssignVIPage />} />
          <Route path="/superadmin/vi-students" element={<SuperadminVIStudentsPage />} />
          <Route path="/superadmin/assign-real-interview" element={<SuperadminAssignRealInterviewPage />} />
          <Route path="/superadmin/real-interview-students" element={<SuperadminRealInterviewStudentsPage />} />

          {/* VI Volunteer Routes */}
          <Route path="/vi/dashboard" element={<VIVolunteerDashboardPage />} />
          <Route path="/vi/interview/:studentId" element={<VIInterviewFormPage />} />
          <Route path="/vi/completed" element={<VICompletedInterviewsPage />} />

          {/* Redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

