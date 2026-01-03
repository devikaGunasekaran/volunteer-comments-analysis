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
<<<<<<< HEAD
            const assigned = approved.filter(s => s.assigned_volunteer_id);
            const unassigned = approved.filter(s => !s.assigned_volunteer_id);
            const completed = completedData.interviews || [];

=======
            const completed = completedData.interviews || [];

            // Calculate Active Assigned VI (Total Assigned - Completed)
            const allAssigned = approved.filter(s => s.assigned_volunteer_id);
            const activeAssigned = allAssigned.filter(s => !completed.some(c => c.studentId === s.studentId));

            const unassigned = approved.filter(s => !s.assigned_volunteer_id);

>>>>>>> Tarun
            // Load RI stats
            const riStatsData = await realInterviewService.getRIStats();
            const riStats = riStatsData.stats || {};

<<<<<<< HEAD
            setStats({
                totalApproved: approved.length,
                assignedVI: assigned.length,
=======
            // Load Final Selection stats
            const finalStatsData = await superadminService.getFinalSelectionStats();
            const finalStats = finalStatsData.stats || {};

            setStats({
                totalApproved: approved.length,
                assignedVI: activeAssigned.length,
>>>>>>> Tarun
                unassignedVI: unassigned.length,
                completedVI: completed.length,
                eligibleRI: riStats.eligible || 0,
                assignedRI: riStats.assigned || 0,
<<<<<<< HEAD
                completedRI: riStats.completed || 0
=======
                completedRI: riStats.completed || 0,
                pendingFinal: finalStats.pending || 0,
                selectedStudents: finalStats.selected || 0,
                rejectedStudents: finalStats.rejected || 0
>>>>>>> Tarun
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
<<<<<<< HEAD
                <div className="header-title">Superadmin Dashboard - Virtual Interview Management</div>
            </header>

            <div className="page-title">Virtual Interview Management</div>

=======
                <div className="header-title">Superadmin Dashboard </div>
            </header>
>>>>>>> Tarun
            {/* Virtual Interview Section */}
            <div className="section-header">
                <h3>📹 Virtual Interview (VI) Management</h3>
            </div>
            <div className="stats-container">
                <div className="stat-card vi-card">
<<<<<<< HEAD
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{stats.totalApproved}</div>
                    <div className="stat-label">Approved Students</div>
                </div>
                <div className="stat-card vi-card">
=======
>>>>>>> Tarun
                    <div className="stat-icon">📋</div>
                    <div className="stat-value">{stats.unassignedVI}</div>
                    <div className="stat-label">Pending VI Assignment</div>
                </div>
                <div className="stat-card vi-card">
                    <div className="stat-icon">👥</div>
                    <div className="stat-value">{stats.assignedVI}</div>
<<<<<<< HEAD
                    <div className="stat-label">VI Assigned</div>
=======
                    <div className="stat-label">VI Assigned (Active)</div>
>>>>>>> Tarun
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

<<<<<<< HEAD
=======
            {/* Final Selection Section */}
            <div className="section-header">
                <h3>🎓 Final Scholarship Selection</h3>
            </div>
            <div className="stats-container">
                <div className="stat-card final-card">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-value">{stats.pendingFinal}</div>
                    <div className="stat-label">Pending Final Decision</div>
                </div>
                <div className="stat-card final-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-value">{stats.selectedStudents}</div>
                    <div className="stat-label">Selected for Scholarship</div>
                </div>
                <div className="stat-card final-card">
                    <div className="stat-icon">❌</div>
                    <div className="stat-value">{stats.rejectedStudents}</div>
                    <div className="stat-label">Rejected</div>
                </div>
            </div>

            {/* Final Selection Action Buttons */}
            <div className="action-buttons-container">
                <button
                    onClick={() => navigate('/superadmin/final-selection')}
                    className="action-btn primary-btn"
                >
                    🎓 Make Final Scholarship Decisions
                </button>
                <button
                    onClick={() => navigate('/superadmin/selected-students')}
                    className="action-btn secondary-btn"
                >
                    📊 View All Final Decisions
                </button>
            </div>

>>>>>>> Tarun
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
