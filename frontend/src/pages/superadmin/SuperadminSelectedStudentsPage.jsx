import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import superadminService from '../../services/superadminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './SuperadminSelectedStudentsPage.css';

const SuperadminSelectedStudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const [filter, setFilter] = useState('ALL'); // ALL, SELECTED, REJECTED
    const navigate = useNavigate();

    useEffect(() => {
        loadFinalDecisions();
    }, []);

    const loadFinalDecisions = async () => {
        try {
            setLoading(true);
            const data = await superadminService.getFinalDecisions();
            setStudents(data.students || []);
        } catch (error) {
            console.error('Error loading final decisions:', error);
            alert('Failed to load decisions. Please try again.');
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

    const filteredStudents = students.filter(s => {
        if (filter === 'ALL') return true;
        return s.finalDecision === filter;
    });

    const selectedCount = students.filter(s => s.finalDecision === 'SELECTED').length;
    const rejectedCount = students.filter(s => s.finalDecision === 'REJECTED').length;

    return (
        <div className="superadmin-selected-students-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Final Scholarship Decisions</div>
            </header>

            <div className="container">
                <div className="page-header">
                    <h2>All Final Decisions</h2>
                    <button
                        onClick={() => navigate('/superadmin/dashboard')}
                        className="back-btn"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                <div className="filter-stats">
                    <button
                        className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
                        onClick={() => setFilter('ALL')}
                    >
                        All ({students.length})
                    </button>
                    <button
                        className={`filter-btn selected ${filter === 'SELECTED' ? 'active' : ''}`}
                        onClick={() => setFilter('SELECTED')}
                    >
                        ✅ Selected ({selectedCount})
                    </button>
                    <button
                        className={`filter-btn rejected ${filter === 'REJECTED' ? 'active' : ''}`}
                        onClick={() => setFilter('REJECTED')}
                    >
                        ❌ Rejected ({rejectedCount})
                    </button>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner">Loading...</div>
                    </div>
                ) : (
                    <div className="decisions-container">
                        {filteredStudents.length === 0 ? (
                            <div className="no-data">
                                No {filter.toLowerCase()} decisions found
                            </div>
                        ) : (
                            <table className="decisions-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>District</th>
                                        <th>Final Decision</th>
                                        <th>Decision Date</th>
                                        <th>Decided By</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student, index) => (
                                        <React.Fragment key={student.studentId}>
                                            <tr>
                                                <td>{index + 1}</td>
                                                <td
                                                    className="student-id clickable"
                                                    onClick={() => navigate(`/superadmin/student-profile/${student.studentId}`)}
                                                    title="Click to view complete profile"
                                                >
                                                    {student.studentId}
                                                </td>
                                                <td>{student.name}</td>
                                                <td>{student.district}</td>
                                                <td>
                                                    <span className={`decision-badge ${student.finalDecision?.toLowerCase()}`}>
                                                        {student.finalDecision === 'SELECTED' ? '✅ SELECTED' : '❌ REJECTED'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {student.finalDecisionDate
                                                        ? new Date(student.finalDecisionDate).toLocaleString()
                                                        : 'N/A'}
                                                </td>
                                                <td>{student.finalDecisionBy || 'N/A'}</td>
                                                <td>
                                                    <button
                                                        className="details-btn"
                                                        onClick={() => toggleRow(student.studentId)}
                                                    >
                                                        {expandedRow === student.studentId ? '▲ Hide' : '▼ Show'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedRow === student.studentId && (
                                                <tr className="expanded-row">
                                                    <td colSpan="8">
                                                        <div className="details-panel">
                                                            <div className="detail-section">
                                                                <h4>Final Decision Remarks</h4>
                                                                <p>{student.finalRemarks || 'No remarks provided'}</p>
                                                            </div>

                                                            <div className="detail-grid">
                                                                <div className="detail-item">
                                                                    <label>VI Recommendation:</label>
                                                                    <span className="recommendation-badge">
                                                                        {student.vi_recommendation || 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <label>RI Recommendation:</label>
                                                                    <span className="recommendation-badge">
                                                                        {student.ri_recommendation || 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <label>Phone:</label>
                                                                    <span>{student.phone || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <label>Email:</label>
                                                                    <span>{student.email || 'N/A'}</span>
                                                                </div>
                                                            </div>

                                                            {student.finalDecision === 'SELECTED' && (
                                                                <div className="action-section" style={{ marginTop: '20px' }}>
                                                                    <button
                                                                        className="edit-edu-btn"
                                                                        onClick={() => navigate('/superadmin/educational-details', { state: { student } })}
                                                                        style={{
                                                                            padding: '8px 16px',
                                                                            backgroundColor: '#4a90e2',
                                                                            color: 'white',
                                                                            border: 'none',
                                                                            borderRadius: '6px',
                                                                            cursor: 'pointer',
                                                                            fontSize: '14px',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px'
                                                                        }}
                                                                    >
                                                                        ✏️ Edit Educational Details
                                                                    </button>
                                                                </div>
                                                            )}

                                                            {student.ri_remarks && (
                                                                <div className="detail-section">
                                                                    <h4>RI Interview Remarks</h4>
                                                                    <p>{student.ri_remarks}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperadminSelectedStudentsPage;
