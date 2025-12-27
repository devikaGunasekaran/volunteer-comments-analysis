import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/auth/LoginPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Placeholder routes - to be created */}
          <Route path="/students-assign" element={<div>Students Assign Page (Coming Soon)</div>} />
          <Route path="/admin/assign" element={<div>Admin Dashboard (Coming Soon)</div>} />
          <Route path="/dashboard" element={<div>Dashboard (Coming Soon)</div>} />

          {/* Redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
