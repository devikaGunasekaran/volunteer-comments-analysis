import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
            'SELECT': { label: 'Recommended', class: 'status-select' },
            'REJECT': { label: 'Not Recommended', class: 'status-reject' },
            'ON HOLD': { label: 'On Hold', class: 'status-hold' }
        };
        const statusInfo = statusMap[status] || { label: status, class: 'status-default' };
        return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.label}</span>;
    };

    return (
        <div className="admin-pv-students-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Admin Panel - Completed Physical Verifications</div>
            </header>

            <div className="page-title">Students with Completed PV ({students.length})</div>

            <div className="table-wrapper">
                <table className="custom-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>District</th>
                            <th>PV Status</th>
                            <th>Volunteer</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>Loading...</td>
                            </tr>
                        ) : students.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>No completed PV students found.</td>
                            </tr>
                        ) : (
                            students.map((s, index) => (
                                <React.Fragment key={s.studentId}>
                                    <tr onClick={() => toggleRow(s.studentId)} style={{ cursor: 'pointer' }}>
                                        <td>{index + 1}</td>
                                        <td>
                                            <Link
                                                to={`/admin/decision/${s.studentId}`}
                                                className="clickable-id"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {s.studentId}
                                            </Link>
                                        </td>
                                        <td>{s.name}</td>
                                        <td>{s.district}</td>
                                        <td>{getStatusBadge(s.sentiment)}</td>
                                        <td>{s.volunteer_email || 'N/A'}</td>
                                    </tr>
                                    {expandedRow === s.studentId && (
                                        <tr className="accordion-row">
                                            <td colSpan="6">
                                                <div className="accordion-content">
                                                    <div className="accordion-grid">
                                                        <div className="detail-item">
                                                            <div className="detail-label">Sentiment Score</div>
                                                            <div className="detail-value">{s.sentiment_text}%</div>
                                                        </div>
                                                        <div className="detail-item">
                                                            <div className="detail-label">Verification Date</div>
                                                            <div className="detail-value">
                                                                {s.verificationDate ? new Date(s.verificationDate).toLocaleDateString() : 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div className="detail-item">
                                                            <div className="detail-label">Student Status</div>
                                                            <div className="detail-value">{s.student_status || 'Pending Review'}</div>
                                                        </div>
                                                        <div className="detail-item" style={{ display: 'flex', alignItems: 'end' }}>
                                                            <Link to={`/admin/decision/${s.studentId}`} className="submit-btn" style={{ padding: '8px 16px', fontSize: '13px', width: 'auto' }}>
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
    );
};

export default AdminPVStudentsPage;
