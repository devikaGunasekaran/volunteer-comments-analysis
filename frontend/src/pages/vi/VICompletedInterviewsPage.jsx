import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import viVolunteerService from '../../services/viVolunteerService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './VICompletedInterviewsPage.css';

const VICompletedInterviewsPage = () => {
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
            const data = await viVolunteerService.getCompletedInterviews();
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


    const getStatusBadgeClass = (status) => {
        switch (status?.toUpperCase()) {
            case 'RECOMMENDED':
                return 'recommended';
            case 'NOT_RECOMMENDED':
                return 'not-recommended';
            case 'ON_HOLD':
                return 'on-hold';
            default:
                return '';
        }
    };


    const getRecommendationText = (recommendation) => {
        switch (recommendation?.toUpperCase()) {
            case 'YES':
                return 'SELECT';
            case 'NO':
                return 'REJECT';
            case 'MAYBE':
                return 'ON HOLD';
            default:
                return recommendation;
        }
    };

    return (
        <div className="vi-completed-interviews-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Completed Interviews</div>
            </header>

            <div className="container">
                <div className="page-header">

                    <h2>My Completed Interviews</h2>
                    <button
                        onClick={() => navigate('/vi/dashboard')}
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
                                No completed interviews yet
                            </div>
                        ) : (
                            <table className="interviews-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student ID</th>
                                        <th>Student Name</th>
                                        <th>District</th>
                                        <th>Interview Date</th>
                                        <th>Recommendation</th>

                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {interviews.map((interview, index) => (
                                        <React.Fragment key={interview.viId}>
                                            <tr>
                                                <td>{index + 1}</td>
                                                <td className="student-id">{interview.studentId}</td>
                                                <td>{interview.student_name}</td>
                                                <td>{interview.district}</td>
                                                <td>
                                                    {interview.interviewDate
                                                        ? new Date(interview.interviewDate).toLocaleString()
                                                        : 'N/A'
                                                    }
                                                </td>
                                                <td>
                                                    <span className={`recommendation-badge ${interview.overallRecommendation?.toLowerCase()}`}>
                                                        {getRecommendationText(interview.overallRecommendation)}
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
                                                        onClick={() => toggleRow(interview.viId)}
                                                    >
                                                        {expandedRow === interview.viId ? '▲ Hide' : '▼ Show'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedRow === interview.viId && (
                                                <tr className="expanded-row">
                                                    <td colSpan="8">
                                                        <div className="details-panel">
                                                            <div className="detail-section">
                                                                <h4>Interview Remarks</h4>
                                                                <p>{interview.comments || 'No remarks provided'}</p>
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

export default VICompletedInterviewsPage;
