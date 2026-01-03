import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import realInterviewService from '../../services/realInterviewService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './SuperadminRealInterviewStudentsPage.css';

const SuperadminRealInterviewStudentsPage = () => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
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
            case 'REJECTED':
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
                                        <th>Recommendation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {interviews.map((interview, index) => (
                                        <tr key={interview.riId}>
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
                                                <span className={`recommendation-badge ${getRecommendationBadgeClass(interview.overallRecommendation)}`}>
                                                    {interview.overallRecommendation || 'N/A'}
                                                </span>
                                            </td>
                                        </tr>
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
