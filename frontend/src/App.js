import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import StudentsAssignPage from './pages/volunteer/StudentsAssignPage';
import StudentDetailsPage from './pages/volunteer/StudentDetailsPage';
import PVFormPage from './pages/volunteer/PVFormPage';
import AdminAssignPage from './pages/admin/AdminAssignPage';
import AdminViewPage from './pages/admin/AdminViewPage';
<<<<<<< HEAD
=======
<<<<<<< Updated upstream
import TVStudentsPage from './pages/tv_volunteer/TVStudentsPage';
import TVStudentDetailsPage from './pages/tv_volunteer/TVStudentDetailsPage';
import TVFormPage from './pages/tv_volunteer/TVFormPage';
import TVAssignmentPage from './pages/admin/TVAssignmentPage';
import TVReportsReviewPage from './pages/admin/TVReportsReviewPage';
import TVReportDetailsPage from './pages/admin/TVReportDetailsPage';
import TVAdminDashboard from './pages/admin/TVAdminDashboard';
=======
>>>>>>> Tarun
import AdminPVStudentsPage from './pages/admin/AdminPVStudentsPage';
import AdminAssignPVPage from './pages/admin/AdminAssignPVPage';
import SuperadminDashboardPage from './pages/superadmin/SuperadminDashboardPage';
import SuperadminAssignVIPage from './pages/superadmin/SuperadminAssignVIPage';
import SuperadminVIStudentsPage from './pages/superadmin/SuperadminVIStudentsPage';
import SuperadminAssignRealInterviewPage from './pages/superadmin/SuperadminAssignRealInterviewPage';
import SuperadminRealInterviewStudentsPage from './pages/superadmin/SuperadminRealInterviewStudentsPage';
<<<<<<< HEAD
import VIVolunteerDashboardPage from './pages/vi/VIVolunteerDashboardPage';
import VIInterviewFormPage from './pages/vi/VIInterviewFormPage';
import VICompletedInterviewsPage from './pages/vi/VICompletedInterviewsPage';
=======
import SuperadminFinalSelectionPage from './pages/superadmin/SuperadminFinalSelectionPage';
import SuperadminSelectedStudentsPage from './pages/superadmin/SuperadminSelectedStudentsPage';
import EducationalDetailsFormPage from './pages/superadmin/EducationalDetailsFormPage';
import StudentProfilePage from './pages/superadmin/StudentProfilePage';
import VIVolunteerDashboardPage from './pages/vi/VIVolunteerDashboardPage';
import VIInterviewFormPage from './pages/vi/VIInterviewFormPage';
import VICompletedInterviewsPage from './pages/vi/VICompletedInterviewsPage';
>>>>>>> Stashed changes
>>>>>>> Tarun
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
<<<<<<< HEAD
          <Route path="/admin/decision/:studentId" element={<AdminViewPage />} />
          <Route path="/admin/pv-students" element={<AdminPVStudentsPage />} />
          <Route path="/admin/assign-pv" element={<AdminAssignPVPage />} />

=======
          <Route path="/admin/view/:studentId" element={<AdminViewPage />} />
          <Route path="/admin/tv-dashboard" element={<TVAdminDashboard />} />
          <Route path="/admin/tv-assignment" element={<TVAssignmentPage />} />
          <Route path="/admin/tv-reports" element={<TVReportsReviewPage />} />
          <Route path="/admin/tv-report/:studentId" element={<TVReportDetailsPage />} />

<<<<<<< Updated upstream
          {/* TV Volunteer Routes */}
          <Route path="/tv/students" element={<TVStudentsPage />} />
          <Route path="/tv/student/:studentId" element={<TVStudentDetailsPage />} />
          <Route path="/tv/form/:studentId" element={<TVFormPage />} />
          <Route path="/tv-volunteer" element={<Navigate to="/tv/students" replace />} />
=======
>>>>>>> Tarun
          {/* Superadmin Routes */}
          <Route path="/superadmin/dashboard" element={<SuperadminDashboardPage />} />
          <Route path="/superadmin/assign-vi" element={<SuperadminAssignVIPage />} />
          <Route path="/superadmin/vi-students" element={<SuperadminVIStudentsPage />} />
          <Route path="/superadmin/assign-real-interview" element={<SuperadminAssignRealInterviewPage />} />
          <Route path="/superadmin/real-interview-students" element={<SuperadminRealInterviewStudentsPage />} />
<<<<<<< HEAD
=======
          <Route path="/superadmin/final-selection" element={<SuperadminFinalSelectionPage />} />
          <Route path="/superadmin/selected-students" element={<SuperadminSelectedStudentsPage />} />
          <Route path="/superadmin/educational-details" element={<EducationalDetailsFormPage />} />
          <Route path="/superadmin/student-profile/:studentId" element={<StudentProfilePage />} />
>>>>>>> Tarun

          {/* VI Volunteer Routes */}
          <Route path="/vi/dashboard" element={<VIVolunteerDashboardPage />} />
          <Route path="/vi/interview/:studentId" element={<VIInterviewFormPage />} />
          <Route path="/vi/completed" element={<VICompletedInterviewsPage />} />
<<<<<<< HEAD
=======
>>>>>>> Stashed changes
>>>>>>> Tarun

          {/* Redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

