import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Home, Video, Target, GraduationCap, BarChart2,
    ClipboardList, CheckCircle, Users, FileText
} from 'lucide-react';
import superadminService from '../../services/superadminService';
import realInterviewService from '../../services/realInterviewService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './SuperadminDashboardPage.css';

const SuperadminDashboardPage = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState({
        totalApproved: 0,
        assignedVI: 0,
        unassignedVI: 0,
        completedVI: 0,
        eligibleRI: 0,
        assignedRI: 0,
        completedRI: 0,
        pendingFinal: 0,
        selectedStudents: 0,
        rejectedStudents: 0
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const [approvedData, completedData] = await Promise.all([
                superadminService.getApprovedStudents(),
                superadminService.getCompletedVI()
            ]);

            const approved = approvedData.students || [];
            const completed = completedData.interviews || [];

            // Calculate Active Assigned VI
            const allAssigned = approved.filter(s => s.assigned_volunteer_id);
            const activeAssigned = allAssigned.filter(s => !completed.some(c => c.studentId === s.studentId));
            const unassigned = approved.filter(s => !s.assigned_volunteer_id);

            // Load RI stats
            const riStatsData = await realInterviewService.getRIStats();
            const riStats = riStatsData.stats || {};

            // Load Final Selection stats
            const finalStatsData = await superadminService.getFinalSelectionStats();
            const finalStats = finalStatsData.stats || {};

            setStats({
                totalApproved: approved.length,
                assignedVI: activeAssigned.length,
                unassignedVI: unassigned.length,
                completedVI: completed.length,
                eligibleRI: riStats.eligible || 0,
                assignedRI: riStats.assigned || 0,
                completedRI: riStats.completed || 0,
                pendingFinal: finalStats.pending || 0,
                selectedStudents: finalStats.selected || 0,
                rejectedStudents: finalStats.rejected || 0
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };



    const renderContent = () => {
        switch (activeTab) {
            case 'vi':
                return (
                    <div className="tab-content fadeIn">
                        <div className="section-header-row">
                            <h3><Video size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Virtual Interview Management</h3>
                            <p className="section-subtitle">Manage assignments and review VI status</p>
                        </div>
                        <div className="stats-grid-3">
                            <div className="stat-card vi-card">
                                <div className="stat-value">{stats.unassignedVI}</div>
                                <div className="stat-label">Pending Assignment</div>
                            </div>
                            <div className="stat-card vi-card">
                                <div className="stat-value">{stats.assignedVI}</div>
                                <div className="stat-label">Active Interviews</div>
                            </div>
                            <div className="stat-card vi-card">
                                <div className="stat-value">{stats.completedVI}</div>
                                <div className="stat-label">Completed</div>
                            </div>
                        </div>
                        <div className="action-row">
                            <button onClick={() => navigate('/superadmin/assign-vi')} className="action-button primary">
                                <ClipboardList size={18} style={{ marginRight: 8 }} /> Assign New VIs
                            </button>
                            <button onClick={() => navigate('/superadmin/vi-students')} className="action-button secondary">
                                <CheckCircle size={18} style={{ marginRight: 8 }} /> View Completed VIs
                            </button>
                        </div>
                    </div>
                );
            case 'ri':
                return (
                    <div className="tab-content fadeIn">
                        <div className="section-header-row">
                            <h3><Target size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Real Interview Management</h3>
                            <p className="section-subtitle">Coordinate in-person interviews</p>
                        </div>
                        <div className="stats-grid-3">
                            <div className="stat-card ri-card">
                                <div className="stat-value">{stats.eligibleRI}</div>
                                <div className="stat-label">Eligible Students</div>
                            </div>
                            <div className="stat-card ri-card">
                                <div className="stat-value">{stats.assignedRI}</div>
                                <div className="stat-label">Assigned</div>
                            </div>
                            <div className="stat-card ri-card">
                                <div className="stat-value">{stats.completedRI}</div>
                                <div className="stat-label">Completed</div>
                            </div>
                        </div>
                        <div className="action-row">
                            <button onClick={() => navigate('/superadmin/assign-real-interview')} className="action-button primary">
                                <Users size={18} style={{ marginRight: 8 }} /> Assign RI Volunteers
                            </button>
                            <button onClick={() => navigate('/superadmin/real-interview-students')} className="action-button secondary">
                                <FileText size={18} style={{ marginRight: 8 }} /> View RI History
                            </button>
                        </div>
                    </div>
                );
            case 'final':
                return (
                    <div className="tab-content fadeIn">
                        <div className="section-header-row">
                            <h3><GraduationCap size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Final Scholarship Selection</h3>
                            <p className="section-subtitle">Make final decisions for scholarships</p>
                        </div>
                        <div className="stats-grid-3">
                            <div className="stat-card final-card">
                                <div className="stat-value">{stats.pendingFinal}</div>
                                <div className="stat-label">Pending Decision</div>
                            </div>
                            <div className="stat-card final-card">
                                <div className="stat-value">{stats.selectedStudents}</div>
                                <div className="stat-label">Selected</div>
                            </div>
                            <div className="stat-card final-card">
                                <div className="stat-value">{stats.rejectedStudents}</div>
                                <div className="stat-label">Rejected</div>
                            </div>
                        </div>
                        <div className="action-row">
                            <button onClick={() => navigate('/superadmin/final-selection')} className="action-button primary">
                                <GraduationCap size={18} style={{ marginRight: 8 }} /> Make Decisions
                            </button>
                            <button onClick={() => navigate('/superadmin/selected-students')} className="action-button secondary">
                                <BarChart2 size={18} style={{ marginRight: 8 }} /> All Decisions
                            </button>
                        </div>
                    </div>
                );
            case 'analytics':
                return (
                    <div className="tab-content fadeIn">
                        <div className="section-header-row">
                            <h3><BarChart2 size={24} style={{ marginRight: 10, verticalAlign: 'middle' }} /> Analytics & Reports</h3>
                            <p className="section-subtitle">Deep dive into application data and AI insights</p>
                        </div>
                        <div className="analytics-placeholder-card">
                            <div className="placeholder-icon"><BarChart2 size={64} strokeWidth={1} /></div>
                            <h4>Full Analytics Dashboard</h4>
                            <p>View detailed visualizations, AI vs Manual comparisons, and application trends.</p>
                            <button onClick={() => navigate('/superadmin/analytics')} className="action-button primary mt-4">
                                Open Analytics Dashboard
                            </button>
                        </div>
                    </div>
                );
            default: // Overview
                return (
                    <div className="tab-content fadeIn">
                        <div className="section-header-row">
                            <h3>Dashboard Overview</h3>
                            <p className="section-subtitle">Welcome back, {user?.name || 'Superadmin'}</p>
                        </div>
                        <div className="overview-grid">
                            <div className="overview-card vi-overview" onClick={() => setActiveTab('vi')}>
                                <div className="ov-icon"><Video size={36} color="#805AD5" /></div>
                                <div className="ov-info">
                                    <h4>Virtual Interview</h4>
                                    <span>{stats.unassignedVI} Pending</span>
                                </div>
                            </div>
                            <div className="overview-card ri-overview" onClick={() => setActiveTab('ri')}>
                                <div className="ov-icon"><Target size={36} color="#3182CE" /></div>
                                <div className="ov-info">
                                    <h4>Real Interview</h4>
                                    <span>{stats.eligibleRI} Eligible</span>
                                </div>
                            </div>
                            <div className="overview-card final-overview" onClick={() => setActiveTab('final')}>
                                <div className="ov-icon"><GraduationCap size={36} color="#38A169" /></div>
                                <div className="ov-info">
                                    <h4>Selection</h4>
                                    <span>{stats.pendingFinal} To Review</span>
                                </div>
                            </div>
                            <div className="overview-card analytics-overview" onClick={() => setActiveTab('analytics')}>
                                <div className="ov-icon"><BarChart2 size={36} color="#ED8936" /></div>
                                <div className="ov-info">
                                    <h4>Analytics</h4>
                                    <span>View Reports</span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="superadmin-layout">
            {/* Sidebar Navigation */}
            <nav className="side-nav">
                <div className="nav-logo">
                    <img src={logo} alt="Matram Logo" className="header-logo-center" />
                    <span>Matram Admin Panel</span>
                </div>

                <div className="nav-links">
                    <button
                        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <span className="icon"><Home size={18} /></span> Overview
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'vi' ? 'active' : ''}`}
                        onClick={() => setActiveTab('vi')}
                    >
                        <span className="icon"><Video size={18} /></span> Virtual Interview
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'ri' ? 'active' : ''}`}
                        onClick={() => setActiveTab('ri')}
                    >
                        <span className="icon"><Target size={18} /></span> Real Interview
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'final' ? 'active' : ''}`}
                        onClick={() => setActiveTab('final')}
                    >
                        <span className="icon"><GraduationCap size={18} /></span> Final Selection
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('analytics')}
                    >
                        <span className="icon"><BarChart2 size={18} /></span> Analytics
                    </button>
                </div>

                <div className="nav-footer">
                    <button onClick={() => {
                        authService.logout();
                        navigate('/login');
                    }} className="back-admin-btn">
                        Sign Out
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="main-content">
                {loading ? (
                    <div className="loading-state">Loading dashboard data...</div>
                ) : (
                    renderContent()
                )}
            </main>
        </div>
    );
};

export default SuperadminDashboardPage;
