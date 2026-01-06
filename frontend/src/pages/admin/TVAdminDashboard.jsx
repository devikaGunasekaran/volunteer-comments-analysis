import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, Video, FileText } from 'lucide-react';
import authService from '../../services/authService';
import adminService from '../../services/adminService';
import logo from '../../assets/logo_icon.jpg';
import './TVAdminDashboard.css';

const TVAdminDashboard = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const [stats, setStats] = useState({ total_assigned: 0, completed: 0, pending: 0 });
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!user || (user.role !== 'tv_admin' && user.role !== 'admin')) {
            navigate('/login');
            return;
        }
        loadStats();
    }, [navigate, user]);

    const loadStats = async () => {
        try {
            const response = await adminService.getTVStatistics();
            if (response.statistics) {
                setStats(response.statistics);
            }
        } catch (error) {
            console.error("Error loading stats:", error);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
            default:
                return (
                    <div className="tab-content fadeIn">
                        <div className="section-header-row">
                            <h3>Dashboard Overview</h3>
                            <p className="section-subtitle">Televerification Administration</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="stats-grid-3">
                            <div className="stat-card total-card">
                                <div className="stat-value">{stats.total_assigned}</div>
                                <div className="stat-label">Total Assigned</div>
                            </div>
                            <div className="stat-card pending-card">
                                <div className="stat-value">{stats.pending}</div>
                                <div className="stat-label">Pending Reviews</div>
                            </div>
                            <div className="stat-card completed-card">
                                <div className="stat-value">{stats.completed}</div>
                                <div className="stat-label">Completed</div>
                            </div>
                        </div>

                        {/* Quick Actions Grid */}
                        <h4 className="section-title">Quick Actions</h4>
                        <div className="action-grid-3">
                            <div className="action-card-modern" onClick={() => navigate('/admin/tv-assignment')}>
                                <div className="action-icon">📋</div>
                                <h3>Assign Students</h3>
                                <p>Assign students to TV volunteers</p>
                            </div>
                            <div className="action-card-modern" onClick={() => navigate('/admin/tv-reports')}>
                                <div className="action-icon">✔️</div>
                                <h3>Reports Review</h3>
                                <p>Review submitted TV reports</p>
                            </div>
                            <div className="action-card-modern" onClick={() => navigate('/admin/tv-students')}>
                                <div className="action-icon">✅</div>
                                <h3>Completed TV</h3>
                                <p>View verification history</p>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    if (!user) return null;

    return (
        <div className="admin-layout">
            {/* Sidebar Navigation */}
            <nav className="side-nav">
                <div className="nav-logo">
                    <img src={logo} alt="Matram Logo" className="header-logo-center" />
                    <span>TV Admin Panel</span>
                </div>

                <div className="nav-links">
                    <button
                        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <span className="icon"><Home size={18} /></span> Overview
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/tv-assignment')}
                    >
                        <span className="icon"><Users size={18} /></span> Assign Students
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/tv-reports')}
                    >
                        <span className="icon"><FileText size={18} /></span> Reports Review
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/tv-students')}
                    >
                        <span className="icon"><Video size={18} /></span> Completed TV
                    </button>
                </div>

                <div className="nav-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        Sign Out
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="main-content">
                {renderContent()}
            </main>
        </div>
    );
};

export default TVAdminDashboard;
