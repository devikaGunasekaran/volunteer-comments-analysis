import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ClipboardList } from 'lucide-react';
import tvService from '../../services/tvService';
import authService from '../../services/authService';
import './TVStudentsPage.css';
import logo from '../../assets/logo_icon.jpg';

const TVStudentsPage = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'tv') {
            navigate('/login');
            return;
        }
        loadStudents();
        const interval = setInterval(loadStudents, 10000);
        return () => clearInterval(interval);
    }, [navigate]);

    const loadStudents = async () => {
        const result = await tvService.getAssignedStudents();
        if (result.success) {
            setStudents(result.students);
            setError('');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getStats = () => {
        const total = students.length;
        const completed = students.filter(s => s.verificationStatus === 'VERIFIED' || s.verificationStatus === 'REJECTED').length;
        const pending = students.filter(s => !s.verificationStatus || s.verificationStatus === 'PENDING').length;
        return { total, completed, pending };
    };

    const stats = getStats();

    const renderContent = () => {
        switch (activeTab) {
            case 'assignments':
                return (
                    <div className="tab-content fadeIn">
                        <div className="section-header-row">
                            <h3>My Assignments</h3>
                            <p className="section-subtitle">List of students assigned for Televerification</p>
                        </div>
                        <div className="table-wrapper">
                            {loading ? (
                                <div className="empty">Loading...</div>
                            ) : error ? (
                                <div className="empty error">Error: {error}</div>
                            ) : students.length === 0 ? (
                                <div className="empty">No students assigned for televerification.</div>
                            ) : (
                                <table>
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Student ID</th>
                                            <th>Name</th>
                                            <th>Phone</th>
                                            <th>District</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student, index) => (
                                            <tr key={student.studentId}>
                                                <td>{index + 1}</td>
                                                <td>
                                                    <Link
                                                        to={`/tv/student/${student.studentId}`}
                                                        className="student-id-link"
                                                    >
                                                        {student.studentId}
                                                    </Link>
                                                </td>
                                                <td>{student.name || ''}</td>
                                                <td>{student.phone || ''}</td>
                                                <td>{student.district || ''}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                );
            case 'overview':
            default:
                return (
                    <div className="tab-content fadeIn">
                        <div className="section-header-row">
                            <h3>Dashboard Overview</h3>
                            <p className="section-subtitle">Televerification Volunteer</p>
                        </div>

                        {/* Stats Grid */}
                        <div className="stats-grid-3">
                            <div className="stat-card total-card">
                                <div className="stat-value">{stats.total}</div>
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

                        {/* Quick Actions */}
                        <h4 className="section-title">Quick Actions</h4>
                        <div className="action-grid-3">
                            <div className="action-card-modern" onClick={() => setActiveTab('assignments')}>
                                <div className="action-icon">📋</div>
                                <h3>View Assignments</h3>
                                <p>Access the list of {stats.pending} pending applications</p>
                            </div>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="admin-layout">
            {/* Sidebar Navigation */}
            <nav className="side-nav">
                <div className="nav-logo">
                    <img src={logo} alt="Matram Logo" className="header-logo-center" />
                    <span>TV Volunteer Panel</span>
                </div>

                <div className="nav-links">
                    <button
                        className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <span className="icon"><Home size={18} /></span> Overview
                    </button>
                    <button
                        className={`nav-item ${activeTab === 'assignments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('assignments')}
                    >
                        <span className="icon"><ClipboardList size={18} /></span> My Assignments
                    </button>
                </div>

                <div className="nav-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        Sign Out
                    </button>
                </div>
            </nav>

            <main className="main-content">
                {renderContent()}
            </main>
        </div>
    );
};

export default TVStudentsPage;
