import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './TVAdminDashboard.css';

const TVAdminDashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || (user.role !== 'tv_admin' && user.role !== 'admin')) {
        navigate('/login');
        return null;
    }

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="admin-assign-page">
            <header className="header-with-logout">
                <button onClick={handleLogout} className="logout-btn-right">Logout</button>
                <div className="header-center-content">
                    <img src={logo} alt="Logo" className="header-logo-center" />
                    <div className="header-title-center">TV Administration</div>
                </div>
            </header>

            <main className="assigned-container">
                <div className="welcome-section">
                    <h2>Welcome, {user.name}!</h2>
                </div>

                <div className="action-grid">
                    <Link to="/admin/tv-assignment" className="action-card">
                        <div className="card-icon">📋</div>
                        <h3>Assign Students</h3>
                        <p>View new applications and assign them to TV volunteers.</p>
                        <span className="card-link">Start Assignment →</span>
                    </Link>

                    <Link to="/admin/tv-reports" className="action-card">
                        <div className="card-icon">✔️</div>
                        <h3>Reports Review</h3>
                        <p>Review submitted TV reports and decide for next PV stage.</p>
                        <span className="card-link">Review Reports →</span>
                    </Link>
                </div>
            </main>
        </div>
    );
};

export default TVAdminDashboard;
