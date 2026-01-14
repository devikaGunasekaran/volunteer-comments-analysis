import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Video, Target, GraduationCap, BarChart2, ArrowLeft, ClipboardList } from 'lucide-react';
import superadminService from '../../services/superadminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './SuperadminFinalSelectionPage.css';

const SuperadminVIStudentsPage = () => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadCompletedInterviews();
    }, []);

    const loadCompletedInterviews = async () => {
        try {
            setLoading(true);
            const data = await superadminService.getCompletedVI();
            setInterviews(data.interviews || []);
        } catch (error) {
            console.error('Error loading completed interviews:', error);
            alert('Failed to load completed interviews. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const toggleRow = (viId) => {
        setExpandedRow(expandedRow === viId ? null : viId);
    };

    const getRecommendationBadgeClass = (recommendation) => {
        switch (recommendation?.toUpperCase()) {
            case 'STRONG_YES':
                return 'strong-yes';
            case 'YES':
                return 'yes';
            case 'MAYBE':
                return 'maybe';
            case 'NO':
                return 'no';
            default:
                return '';
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED':
                return 'completed';
            case 'RECOMMENDED':
                return 'recommended';
            case 'NOT_RECOMMENDED':
                return 'not-recommended';
            default:
                return '';
        }
    };

    return (
        <div className="admin-layout">
            <nav className="side-nav">
                <div className="nav-logo">
                    <img src={logo} alt="Matram Logo" className="header-logo-center" />
                    <span>Matram Admin Panel</span>
                </div>
                <div className="nav-links">
                    <button className="nav-item" onClick={() => navigate('/superadmin/dashboard')}>
                        <span className="icon"><Home size={18} /></span> Overview
                    </button>
                    <button className="nav-item active" onClick={() => navigate('/superadmin/vi-students')}>
                        <span className="icon"><Video size={18} /></span> Virtual Interview
                    </button>
                    <button className="nav-item" onClick={() => navigate('/superadmin/real-interview-students')}>
                        <span className="icon"><Target size={18} /></span> Real Interview
                    </button>
                    <button className="nav-item" onClick={() => navigate('/superadmin/final-selection')}>
                        <span className="icon"><GraduationCap size={18} /></span> Final Selection
                    </button>
                    <button className="nav-item" onClick={() => navigate('/superadmin/analytics')}>
                        <span className="icon"><BarChart2 size={18} /></span> Analytics
                    </button>
                </div>
                <div className="nav-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        Sign Out
                    </button>
                </div>
            </nav>

            <main className="main-content">
                <div className="superadmin-final-selection-page">
                    <div className="container">
                        <div className="page-header">
                            <h2>Completed Virtual Interviews</h2>
                            <button
                                onClick={() => navigate('/superadmin/dashboard')}
                                className="back-btn"
                            >
                                <ArrowLeft size={18} style={{ marginRight: 8 }} /> Back to Dashboard
                            </button>
                        </div>

                        {loading ? (
                            <div className="loading-container">
                                <div className="loading-spinner">Loading...</div>
                            </div>
                        ) : interviews.length === 0 ? (
                            <div className="no-data">
                                No completed interviews found
                            </div>
                        ) : (
                            <div className="table-container">
                                <table className="students-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Student ID</th>
                                            <th>Student Name</th>
                                            <th>District</th>
                                            <th>VI Volunteer</th>
                                            <th>Interview Date</th>
                                            <th>Recommendation</th>
                                            <th>Status</th>
                                            <th>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {interviews.map((interview, index) => (
                                            <React.Fragment key={interview.viId}>
                                                <tr
                                                    onClick={() => toggleRow(interview.viId)}
                                                    className="clickable-row"
                                                >
                                                    <td>{index + 1}</td>
                                                    <td
                                                        className="student-id clickable-id"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/superadmin/student-profile/${interview.studentId}`);
                                                        }}
                                                        title="View Student Profile"
                                                    >
                                                        {interview.studentId}
                                                    </td>
                                                    <td>{interview.student_name}</td>
                                                    <td>{interview.district}</td>
                                                    <td>
                                                        <div className="volunteer-info">
                                                            <div className="volunteer-name">
                                                                {interview.volunteer_name || interview.volunteerId}
                                                            </div>
                                                            <div className="volunteer-email">
                                                                {interview.volunteer_email}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {interview.interviewDate
                                                            ? new Date(interview.interviewDate).toLocaleString()
                                                            : 'N/A'
                                                        }
                                                    </td>
                                                    <td>
                                                        <span className={`recommendation-badge ${getRecommendationBadgeClass(interview.overallRecommendation)}`}>
                                                            {interview.overallRecommendation || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${getStatusBadgeClass(interview.status)}`}>
                                                            {interview.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="details-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleRow(interview.viId);
                                                            }}
                                                        >
                                                            {expandedRow === interview.viId ? '▲ Hide' : '▼ Show'}
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedRow === interview.viId && (
                                                    <tr className="expanded-row">
                                                        <td colSpan="9">
                                                            <div className="details-panel">
                                                                <h3 className="journey-title">Virtual Interview Details</h3>

                                                                <div className="journey-section">
                                                                    <h4><ClipboardList size={16} style={{ marginRight: 5, verticalAlign: 'middle' }} /> Interview Information</h4>
                                                                    <div className="detail-grid">
                                                                        <div className="detail-item">
                                                                            <label>Overall Recommendation:</label>
                                                                            <span className={`recommendation-badge ${getRecommendationBadgeClass(interview.overallRecommendation)}`}>
                                                                                {interview.overallRecommendation || 'N/A'}
                                                                            </span>
                                                                        </div>
                                                                        <div className="detail-item">
                                                                            <label>Status:</label>
                                                                            <span className={`status-badge ${getStatusBadgeClass(interview.status)}`}>
                                                                                {interview.status}
                                                                            </span>
                                                                        </div>
                                                                        <div className="detail-item">
                                                                            <label>Interview Date:</label>
                                                                            <span>{interview.interviewDate ? new Date(interview.interviewDate).toLocaleString() : 'N/A'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="journey-section">
                                                                    <h4>Comments</h4>
                                                                    <div className="comments-box">
                                                                        <p>{interview.comments || 'No comments provided'}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SuperadminVIStudentsPage;
