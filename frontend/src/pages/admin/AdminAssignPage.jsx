import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './AdminAssignPage.css';

const AdminAssignPage = () => {
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
            const data = await adminService.getPendingStudents();
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

    const getStatusClass = (status) => {
        switch (status) {
            case 'SELECT': return 'select';
            case 'REJECT': return 'reject';
            case 'ON HOLD': return 'hold';
            default: return 'pending';
        }
    };

    return (
        <div className="admin-assign-page">
            <header className="header">
                <div><img src={logo} alt="Logo" className="logo-img" /></div>
                <div className="header-title">Admin Panel - Verified Students</div>
                <div>
                    <button onClick={handleLogout} className="logout-link">LOGOUT</button>
                </div>
            </header>

            <div className="assigned-container">
                {/* Navigation Buttons */}
                <div className="nav-buttons-container">
                    <button
                        onClick={() => navigate('/admin/assign-pv')}
                        className="nav-btn assign-pv-btn"
                    >
                        📋 Assign PV Volunteers
                    </button>
                    <button
                        onClick={() => navigate('/admin/pv-students')}
                        className="nav-btn completed-pv-btn"
                    >
                        ✅ View Completed PV
                    </button>
                </div>

                <h2 className="page-title">Students Pending Review ({students.length})</h2>

                <div className="table-wrapper">
                    <table className="custom-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>District</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>Loading...</td>
                                </tr>
                            ) : students.length === 0 ? (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px' }}>No pending students found.</td>
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
                                        </tr>
                                        {expandedRow === s.studentId && (
                                            <tr className="accordion-row">
                                                <td colSpan="4">
                                                    <div className="accordion-content">
                                                        <div className="accordion-grid">
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
        </div>
    );
};

export default AdminAssignPage;
