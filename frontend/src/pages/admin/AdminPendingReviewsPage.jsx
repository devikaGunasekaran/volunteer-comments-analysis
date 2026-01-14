import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, CheckCircle, Clock } from 'lucide-react';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './AdminPendingReviewsPage.css';

const AdminPendingReviewsPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadStudents();
        const interval = setInterval(loadStudents, 10000); // Auto-refresh every 10s
        return () => clearInterval(interval);
    }, []);

    const loadStudents = async () => {
        try {
            const data = await adminService.getPVPendingReviews();

            if (data.students) {
                setStudents(data.students);
            }
        } catch (error) {
            console.error("Failed to load students:", error);
            if (error.response && error.response.status === 401) {
                authService.logout();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const toggleRow = (studentId) => {
        setExpandedRow(expandedRow === studentId ? null : studentId);
    };

    return (
        <div className="admin-layout animate-fadeIn">
            {/* Sidebar Navigation */}
            <nav className="side-nav">
                <div className="nav-logo">
                    <img src={logo} alt="Matram Logo" className="header-logo-center" />
                    <span>PV Admin Panel</span>
                </div>

                <div className="nav-links">
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/dashboard')}
                    >
                        <span className="icon"><Home size={18} /></span> Overview
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/assign')}
                    >
                        <span className="icon"><Users size={18} /></span> Assign Volunteers
                    </button>
                    <button
                        className="nav-item active"
                        onClick={() => { }}
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

            {/* Main Content */}
            <main className="main-content">
                <div className="page-container">
                    {/* Page Header */}
                    <div className="page-header animate-slideUp">
                        <div className="header-text">
                            <h1 className="page-title">Pending Reviews</h1>
                            <p className="page-subtitle">
                                Review PV completed students and approve for Virtual Interview
                            </p>
                        </div>
                        <div className="header-badge">
                            <span className="badge badge-primary">
                                <Clock size={14} /> {students.length} Pending
                            </span>
                        </div>
                    </div>

                    {/* Students Table */}
                    <div className="card animate-slideUp stagger-1">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>District</th>
                                        <th>Volunteer Rec.</th>
                                        <th>AI Decision</th>
                                        <th>AI Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="empty-state">
                                                <div className="spinner"></div>
                                                <p>Loading pending students...</p>
                                            </td>
                                        </tr>
                                    ) : students.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="empty-state">
                                                <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center' }}><CheckCircle size={48} color="#10B981" /></div>
                                                <div className="empty-state-title">All Caught Up!</div>
                                                <div className="empty-state-description">
                                                    No students pending review at the moment
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((s, index) => (
                                            <React.Fragment key={s.studentId}>
                                                <tr
                                                    onClick={() => toggleRow(s.studentId)}
                                                    className="hover-lift-sm"
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <Link
                                                            to={`/admin/view/${s.studentId}`}
                                                            className="student-id-link"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            {s.studentId}
                                                        </Link>
                                                    </td>
                                                    <td className="font-semibold">{s.name}</td>
                                                    <td>{s.district}</td>
                                                    <td>
                                                        <span className={`badge ${s.pv_recommendation === 'SELECT' ? 'badge-success' : s.pv_recommendation === 'REJECT' ? 'badge-danger' : 'badge-warning'}`}>
                                                            {s.pv_recommendation || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${s.ai_decision === 'SELECT' ? 'badge-success' : s.ai_decision === 'REJECT' ? 'badge-danger' : 'badge-warning'}`}>
                                                            {s.ai_decision || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td>{s.ai_score ? `${s.ai_score}%` : 'N/A'}</td>
                                                </tr>
                                                {expandedRow === s.studentId && (
                                                    <tr className="accordion-row">
                                                        <td colSpan="7">
                                                            <div className="accordion-content animate-slideDown">
                                                                <div className="detail-grid">
                                                                    <div className="detail-item">
                                                                        <div className="detail-label">Elements Observed</div>
                                                                        <div className="detail-value">{s.elementsSummary || 'N/A'}</div>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <div className="detail-label">Volunteer Comment</div>
                                                                        <div className="detail-value">{s.comment || 'N/A'}</div>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <div className="detail-label">Sentiment Score</div>
                                                                        <div className="detail-value">{s.sentiment_text}%</div>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <Link
                                                                            to={`/admin/view/${s.studentId}`}
                                                                            className="btn btn-primary btn-sm" style={{ backgroundColor: '#FF6F00', color: 'white' }}
                                                                        >
                                                                            View Full Details & Decide →
                                                                        </Link>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default AdminPendingReviewsPage;
