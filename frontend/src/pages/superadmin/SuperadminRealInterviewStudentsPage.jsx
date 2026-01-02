import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import realInterviewService from '../../services/realInterviewService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './SuperadminRealInterviewStudentsPage.css';

const SuperadminRealInterviewStudentsPage = () => {
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
            const data = await realInterviewService.getCompletedInterviews();
            setInterviews(data.interviews || []);
        } catch (error) {
            console.error('Error loading completed RIs:', error);
            alert('Failed to load completed interviews. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const toggleRow = (riId) => {
        setExpandedRow(expandedRow === riId ? null : riId);
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

    return (
        <div className="superadmin-ri-students-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Completed Real Interviews</div>
            </header>

            <div className="container">
                <div className="page-header">
                    <h2>Completed Real Interviews</h2>
                    <button
                        onClick={() => navigate('/superadmin/dashboard')}
                        className="back-btn"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner">Loading...</div>
                    </div>
                ) : (
                    <div className="interviews-container">
                        {interviews.length === 0 ? (
                            <div className="no-data">
                                No completed real interviews found
                            </div>
                        ) : (
                            <table className="interviews-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student ID</th>
                                        <th>Student Name</th>
                                        <th>District</th>
                                        <th>RI Volunteer</th>
                                        <th>Interview Date</th>
                                        <th>Status</th>
                                        <th>Recommendation</th>
                                        <th>Scores</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {interviews.map((interview, index) => (
                                        <React.Fragment key={interview.riId}>
                                            <tr>
                                                <td>{index + 1}</td>
                                                <td className="student-id">{interview.studentId}</td>
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
                                                        : 'N/A'}
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${getStatusBadgeClass(interview.status)}`}>
                                                        {interview.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`recommendation-badge ${getRecommendationBadgeClass(interview.overallRecommendation)}`}>
                                                        {interview.overallRecommendation || 'N/A'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="scores">
                                                        <div>Tech: {interview.technicalScore || 'N/A'}</div>
                                                        <div>Comm: {interview.communicationScore || 'N/A'}</div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button
                                                        className="details-btn"
                                                        onClick={() => toggleRow(interview.riId)}
                                                    >
                                                        {expandedRow === interview.riId ? '▲ Hide' : '▼ Show'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedRow === interview.riId && (
                                                <tr className="expanded-row">
                                                    <td colSpan="10">
                                                        <div className="details-panel">
                                                            <div className="detail-section">
                                                                <h4>Interview Remarks</h4>
                                                                <p>{interview.remarks || 'No remarks provided'}</p>
                                                            </div>

                                                            <div className="detail-grid">
                                                                <div className="detail-item">
                                                                    <label>Technical Score:</label>
                                                                    <span className="score-value">
                                                                        {interview.technicalScore || 'N/A'}/100
                                                                    </span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <label>Communication Score:</label>
                                                                    <span className="score-value">
                                                                        {interview.communicationScore || 'N/A'}/100
                                                                    </span>
                                                                </div>
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
                                                                    <label>Student Phone:</label>
                                                                    <span>{interview.phone || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <label>Assigned Date:</label>
                                                                    <span>
                                                                        {interview.assignedDate
                                                                            ? new Date(interview.assignedDate).toLocaleDateString()
                                                                            : 'N/A'}
                                                                    </span>
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
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperadminRealInterviewStudentsPage;
