import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import superadminService from '../../services/superadminService';
import realInterviewService from '../../services/realInterviewService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './SuperadminDashboardPage.css';

const SuperadminDashboardPage = () => {
    const [stats, setStats] = useState({
        totalApproved: 0,
        assignedVI: 0,
        unassignedVI: 0,
        completedVI: 0
    });
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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
            const assigned = approved.filter(s => s.assigned_volunteer_id);
            const unassigned = approved.filter(s => !s.assigned_volunteer_id);
            const completed = completedData.interviews || [];

            // Load RI stats
            const riStatsData = await realInterviewService.getRIStats();
            const riStats = riStatsData.stats || {};

            setStats({
                totalApproved: approved.length,
                assignedVI: assigned.length,
                unassignedVI: unassigned.length,
                completedVI: completed.length,
                eligibleRI: riStats.eligible || 0,
                assignedRI: riStats.assigned || 0,
                completedRI: riStats.completed || 0
            });
        } catch (error) {
            console.error('Error loading stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="superadmin-dashboard-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Superadmin Dashboard - Virtual Interview Management</div>
            </header>

            <div className="page-title">Virtual Interview Management</div>

            {/* Virtual Interview Section */}
            <div className="section-header">
                <h3>📹 Virtual Interview (VI) Management</h3>
            </div>
            <div className="stats-container">
                <div className="stat-card vi-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{stats.totalApproved}</div>
                    <div className="stat-label">Approved Students</div>
                </div>
                <div className="stat-card vi-card">
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{stats.unassignedVI}</div>
                    <div className="stat-label">Pending VI Assignment</div>
                </div>
                <div className="stat-card vi-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-value">{stats.assignedVI}</div>
                    <div className="stat-label">VI Assigned</div>
                </div>
                <div className="stat-card vi-card">
                    <div className="stat-icon">✨</div>
                    <div className="stat-value">{stats.completedVI}</div>
                    <div className="stat-label">VI Completed</div>
                </div>
            </div>

            {/* VI Action Buttons */}
            <div className="action-buttons-container">
                <button
                    onClick={() => navigate('/superadmin/assign-vi')}
                    className="action-btn primary-btn"
                >
                    📋 Assign VI Volunteers
                </button>
                <button
                    onClick={() => navigate('/superadmin/vi-students')}
                    className="action-btn secondary-btn"
                >
                    ✅ View Completed VIs
                </button>
            </div>

            {/* Real Interview Section */}
            <div className="section-header">
                <h3>🎯 Real Interview (RI) Management</h3>
            </div>
            <div className="stats-container">
                <div className="stat-card ri-card">
                    <div className="stat-icon">🎯</div>
                    <div className="stat-value">{stats.eligibleRI}</div>
                    <div className="stat-label">Eligible for Real Interview</div>
                </div>
                <div className="stat-card ri-card">
                    <div className="stat-icon">📝</div>
                    <div className="stat-value">{stats.assignedRI}</div>
                    <div className="stat-label">RI Assigned</div>
                </div>
                <div className="stat-card ri-card">
                    <div className="stat-icon">🏆</div>
                    <div className="stat-value">{stats.completedRI}</div>
                    <div className="stat-label">RI Completed</div>
                </div>
            </div>

            {/* RI Action Buttons */}
            <div className="action-buttons-container">
                <button
                    onClick={() => navigate('/superadmin/assign-real-interview')}
                    className="action-btn primary-btn"
                >
                    🎯 Assign Real Interview Volunteers
                </button>
                <button
                    onClick={() => navigate('/superadmin/real-interview-students')}
                    className="action-btn secondary-btn"
                >
                    🏆 View Completed Real Interviews
                </button>
            </div>

            {/* Back Button */}
            <div className="action-buttons-container">
                <button
                    onClick={() => navigate('/admin/assign')}
                    className="action-btn tertiary-btn"
                >
                    🔙 Back to Admin Panel
                </button>
            </div>

            {loading && (
                <div className="loading-overlay">
                    <div className="loading-spinner">Loading...</div>
                </div>
            )}
        </div>
    );
};

export default SuperadminDashboardPage;
