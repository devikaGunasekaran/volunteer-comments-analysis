import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ClipboardList, CheckCircle } from 'lucide-react';
import viVolunteerService from '../../services/viVolunteerService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './VIVolunteerDashboardPage.css';

const VIVolunteerDashboardPage = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const [stats, setStats] = useState({ total_assigned: 0, completed: 0, pending: 0 });
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!user || user.role !== 'vi') {
            navigate('/login');
            return;
        }
        loadStats();
    }, [navigate, user]);

    const loadStats = async () => {
        try {
            const result = await viVolunteerService.getAssignedStudents();
            if (result.success) {
                const students = result.students || [];
                const total = students.length;
                const completed = students.filter(s => s.vi_status === 'COMPLETED').length;
                const pending = total - completed;
                setStats({ total_assigned: total, completed, pending });
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
                            <p className="section-subtitle">Virtual Interview Volunteer</p>
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
                            <div className="action-card-modern" onClick={() => navigate('/vi/assigned')}>
                                <div className="action-icon"><ClipboardList size={32} /></div>
                                <h3>My Assignments</h3>
                                <p>View and interview assigned students</p>
                            </div>
                            <div className="action-card-modern" onClick={() => navigate('/vi/completed')}>
                                <div className="action-icon"><CheckCircle size={32} /></div>
                                <h3>Completed Interviews</h3>
                                <p>View history of completed interviews</p>
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
                    <span>VI Volunteer Panel</span>
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
                        onClick={() => navigate('/vi/assigned')}
                    >
                        <span className="icon"><ClipboardList size={18} /></span> My Assignments
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/vi/completed')}
                    >
                        <span className="icon"><CheckCircle size={18} /></span> Completed Interviews
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

export default VIVolunteerDashboardPage;
