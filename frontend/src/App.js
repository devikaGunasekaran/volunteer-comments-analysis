import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import StudentsAssignPage from './pages/volunteer/StudentsAssignPage';
import StudentDetailsPage from './pages/volunteer/StudentDetailsPage';
import PVFormPage from './pages/volunteer/PVFormPage';
import AdminAssignPage from './pages/admin/AdminAssignPage';
import AdminViewPage from './pages/admin/AdminViewPage';
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

          {/* Redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
