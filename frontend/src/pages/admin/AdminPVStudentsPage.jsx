import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, CheckCircle, Clock } from 'lucide-react';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './AdminPVStudentsPage.css';

const AdminPVStudentsPage = () => {
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
            const data = await adminService.getCompletedPVStudents();
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
            'SELECT': { label: 'Recommended', class: 'badge-success' },
            'RECOMMENDED': { label: 'Recommended', class: 'badge-success' },
            'REJECT': { label: 'Not Recommended', class: 'badge-danger' },
            'DO NOT SELECT': { label: 'Do Not Select', class: 'badge-danger' },
            'ON HOLD': { label: 'On Hold', class: 'badge-warning' }
        };
        const statusInfo = statusMap[status] || { label: status, class: 'badge-gray' };
        return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
    };

    const getAdminStatusBadge = (status) => {
        const statusMap = {
            'VI': { label: 'Selected', class: 'badge-success' },
            'APPROVED': { label: 'Selected', class: 'badge-success' },
            'REJECTED': { label: 'Rejected', class: 'badge-danger' },
            'TV': { label: 'Selected (TV)', class: 'badge-success' },
            'RI': { label: 'Selected (RI)', class: 'badge-success' },
            'SELECTED': { label: 'Selected', class: 'badge-success' },
            'COMPLETED': { label: 'Completed', class: 'badge-info' }
        };
        const statusInfo = statusMap[status] || { label: status || 'Pending', class: 'badge-gray' };
        return <span className={`badge ${statusInfo.class}`}>{statusInfo.label}</span>;
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
                        className="nav-item"
                        onClick={() => navigate('/admin/reviews')}
                    >
                        <span className="icon"><Clock size={18} /></span> Pending Reviews
                    </button>
                    <button
                        className="nav-item active"
                        onClick={() => { }}
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
                            <h1 className="page-title">Completed Physical Verifications</h1>
                            <p className="page-subtitle">
                                Students who have completed PV and are ready for final decision
                            </p>
                        </div>
                        <div className="header-badge">
                            <span className="badge badge-primary">{students.length} Students</span>
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
                                        <th>Volunteer Rec</th>
                                        <th>Admin Status</th>
                                        <th>Volunteer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="7" className="empty-state">
                                                <div className="spinner"></div>
                                                <p>Loading students...</p>
                                            </td>
                                        </tr>
                                    ) : students.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="empty-state">
                                                <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center' }}><FileText size={48} color="#9CA3AF" /></div>
                                                <div className="empty-state-title">No Completed PV Students</div>
                                                <div className="empty-state-description">
                                                    Students will appear here once they complete physical verification
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
                                                    <td>{getStatusBadge(s.pv_recommendation)}</td>
                                                    <td>{getAdminStatusBadge(s.final_status)}</td>
                                                    <td className="text-tertiary">{s.volunteer_email || 'N/A'}</td>
                                                </tr>
                                                {expandedRow === s.studentId && (
                                                    <tr className="accordion-row">
                                                        <td colSpan="7">
                                                            <div className="accordion-content animate-slideDown">
                                                                <div className="detail-grid">
                                                                    <div className="detail-item">
                                                                        <div className="detail-label">AI Score</div>
                                                                        <div className="detail-value">{s.ai_score || 'N/A'}</div>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <div className="detail-label">Verification Date</div>
                                                                        <div className="detail-value">
                                                                            {s.verificationDate ? new Date(s.verificationDate).toLocaleDateString() : 'N/A'}
                                                                        </div>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <div className="detail-label">Admin Remarks</div>
                                                                        <div className="detail-value">{s.admin_remarks || 'None'}</div>
                                                                    </div>
                                                                    <div className="detail-item">
                                                                        <Link
                                                                            to={`/admin/view/${s.studentId}`}
                                                                            className="btn btn-primary btn-sm" style={{ backgroundColor: '#FF6F00', color: 'white' }}
                                                                        >
                                                                            View Full Details →
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

export default AdminPVStudentsPage;
