import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Users, Video, FileText } from 'lucide-react';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './AdminTVStudentsPage.css';

const AdminTVStudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadStudents();
        const interval = setInterval(loadStudents, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadStudents = async () => {
        try {
            const data = await adminService.getCompletedTVStudents();
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

    const getStatusBadge = (status) => {
        const statusMap = {
            'VERIFIED': { label: 'Verified', class: 'badge-success' },
            'REJECTED': { label: 'Rejected', class: 'badge-danger' },
        };
        const statusInfo = statusMap[status] || { label: status, class: 'badge-gray' };
        return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
    };

    return (
        <div className="admin-layout animate-fadeIn">
            <nav className="side-nav">
                <div className="nav-logo">
                    <img src={logo} alt="Matram Logo" className="header-logo-center" />
                    <span>TV Admin Panel</span>
                </div>
                <div className="nav-links">
                    <button className="nav-item" onClick={() => navigate('/admin/tv-dashboard')}>
                        <span className="icon"><Home size={18} /></span> Overview
                    </button>
                    <button className="nav-item" onClick={() => navigate('/admin/tv-assignment')}>
                        <span className="icon"><Users size={18} /></span> Assign Volunteers
                    </button>
                    <button className="nav-item active" onClick={() => { }}>
                        <span className="icon"><Video size={18} /></span> Completed TV
                    </button>
                    <button className="nav-item" onClick={() => navigate('/admin/tv-reports')}>
                        <span className="icon"><FileText size={18} /></span> Review Reports
                    </button>
                </div>
                <div className="nav-footer">
                    <button onClick={handleLogout} className="logout-btn">Sign Out</button>
                </div>
            </nav>

            <main className="main-content">
                <div className="page-container">
                    <div className="page-header animate-slideUp">
                        <div className="header-text">
                            <h1 className="page-title">Completed TeleVerifications</h1>
                            <p className="page-subtitle">Students who have completed TV interviews</p>
                        </div>
                        <div className="header-badge">
                            <span className="badge badge-primary">{students.length} Students</span>
                        </div>
                    </div>

                    <div className="card animate-slideUp stagger-1">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>District</th>
                                        <th>TV Status</th>
                                        <th>Volunteer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="6" className="empty-state">
                                                <div className="spinner"></div>
                                                <p>Loading students...</p>
                                            </td>
                                        </tr>
                                    ) : students.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="empty-state">
                                                <div className="empty-state-icon">📹</div>
                                                <div className="empty-state-title">No Completed TV Students</div>
                                                <div className="empty-state-description">
                                                    Students will appear here once they complete televerification
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        students.map((s, index) => (
                                            <React.Fragment key={s.studentId}>
                                                <tr onClick={() => toggleRow(s.studentId)} className="hover-lift-sm" style={{ cursor: 'pointer' }}>
                                                    <td>{index + 1}</td>
                                                    <td>
                                                        <Link to={`/admin/tv-report/${s.studentId}`} className="student-id-link" onClick={(e) => e.stopPropagation()}>
                                                            {s.studentId}
                                                        </Link>
                                                    </td>
                                                    <td className="font-semibold">{s.name}</td>
                                                    <td>{s.district}</td>
                                                    <td>{getStatusBadge(s.tv_status)}</td>
                                                    <td className="text-tertiary">{s.volunteer_name || s.volunteer_email || 'N/A'}</td>
                                                </tr>
                                                {expandedRow === s.studentId && (
                                                    <tr className="accordion-row">
                                                        <td colSpan="6">
                                                            <div className="accordion-content animate-slideDown">
                                                                <div className="detail-grid">
                                                                    <div className="detail-item">
                                                                        <div className="detail-label">Verification Date</div>
                                                                        <div className="detail-value">
                                                                            {s.tv_date ? new Date(s.tv_date).toLocaleDateString() : 'N/A'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <div className="detail-label">Comments</div>
                                                                        <div className="detail-value">{s.tv_comments || 'No comments'}</div>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <Link to={`/admin/tv-report/${s.studentId}`} className="btn btn-primary btn-sm">
                                                                            View Report Details →
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

export default AdminTVStudentsPage;
