import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Users, Clock, CheckCircle, Search } from 'lucide-react';
import authService from '../../services/authService';
import adminService from '../../services/adminService';
import logo from '../../assets/logo_icon.jpg';
import './AdminAssignPage.css';

const AdminAssignPage = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const [stats, setStats] = useState({ total_assigned: 0, completed: 0, pending: 0 });
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!user || (user.role !== 'admin' && user.role !== 'pv_admin')) {
            navigate('/login');
            return;
        }
        loadStats();
    }, [navigate, user]);

    const loadStats = async () => {
        try {
            const response = await adminService.getPVStatistics();
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
                            <p className="section-subtitle">Physical Verification Administration</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="stats-grid-3">
                            <div className="stat-card total-card">
                                <div className="stat-value">{stats.total_assigned}</div>
                                <div className="stat-label">Total Assigned</div>
                            </div>
                            <div className="stat-card pending-card">
                                <div className="stat-value">{stats.pending}</div>
                                <div className="stat-label">Pending Verification</div>
                            </div>
                            <div className="stat-card completed-card">
                                <div className="stat-value">{stats.completed}</div>
                                <div className="stat-label">Completed</div>
                            </div>
                        </div>

                        {/* Quick Actions Grid */}
                        <h4 className="section-title">Quick Actions</h4>
                        <div className="action-grid-3">
                            <div className="action-card-modern" onClick={() => navigate('/admin/assign-pv')}>
                                <div className="action-icon">📋</div>
                                <h3>Assign Volunteers</h3>
                                <p>Assign students to PV volunteers</p>
                            </div>
                            <div className="action-card-modern" onClick={() => navigate('/admin/reviews')}>
                                <div className="action-icon"><Search size={24} /></div>
                                <h3>Pending Reviews</h3>
                                <p>Review verified student reports</p>
                            </div>
                            <div className="action-card-modern" onClick={() => navigate('/admin/pv-students')}>
                                <div className="action-icon"><CheckCircle size={24} /></div>
                                <h3>Completed PV</h3>
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
                    <span>PV Admin Panel</span>
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
                        onClick={() => navigate('/admin/assign-pv')}
                    >
                        <span className="icon"><Users size={18} /></span> Assign Volunteers
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/reviews')}
                    >
                        <span className="icon"><Clock size={18} /></span> Pending Reviews
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/pv-students')}
                    >
                        <span className="icon"><CheckCircle size={18} /></span> Completed PV
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

export default AdminAssignPage;
