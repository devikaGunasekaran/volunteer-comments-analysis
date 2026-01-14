import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ClipboardList, CheckCircle, ArrowLeft } from 'lucide-react';
import viVolunteerService from '../../services/viVolunteerService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './VICompletedInterviewsPage.css';

const VICompletedInterviewsPage = () => {
    const [interviews, setInterviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const [studentDetails, setStudentDetails] = useState({});
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

    const toggleRow = async (studentId) => {
        if (expandedRow === studentId) {
            setExpandedRow(null);
        } else {
            setExpandedRow(studentId);
            // Load student details if not already loaded
            if (!studentDetails[studentId]) {
                try {
                    const details = await viVolunteerService.getStudentDetails(studentId);
                    setStudentDetails(prev => ({ ...prev, [studentId]: details }));
                } catch (error) {
                    console.error('Error loading student details:', error);
                    alert('Failed to load student details');
                }
            }
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
        <div className="admin-layout">
            {/* Sidebar Navigation */}
            <nav className="side-nav">
                <div className="nav-logo">
                    <img src={logo} alt="Matram Logo" className="header-logo-center" />
                    <span>VI Volunteer Panel</span>
                </div>

                <div className="nav-links">
                    <button
                        className="nav-item"
                        onClick={() => navigate('/vi/dashboard')}
                    >
                        <span className="icon"><Home size={18} /></span> Overview
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/vi/assigned')}
                    >
                        <span className="icon"><ClipboardList size={18} /></span> My Assignments
                    </button>
                    <button
                        className="nav-item active"
                        onClick={() => navigate('/vi/completed')}
                    >
                        <span className="icon"><CheckCircle size={18} /></span> Completed Interviews
                    </button>
                </div>

                <div className="nav-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        Sign Out
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="main-content">
                <div className="page-header">
                    <h2>My Completed Interviews</h2>
                    <button onClick={() => navigate('/vi/dashboard')} className="back-btn">
                        <ArrowLeft size={18} style={{ marginRight: 6 }} /> Back to Dashboard
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
                                                <td
                                                    className="student-id clickable"
                                                    onClick={() => toggleRow(interview.studentId)}
                                                    style={{ cursor: 'pointer', color: '#0066cc' }}
                                                    title="Click to view details"
                                                >
                                                    {interview.studentId}
                                                </td>
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
                                                    <button
                                                        className="details-btn"
                                                        onClick={() => toggleRow(interview.studentId)}
                                                    >
                                                        {expandedRow === interview.studentId ? '▲ Hide' : '▼ Show'}
                                                    </button>
                                                </td>
                                            </tr>
                                            {expandedRow === interview.studentId && (
                                                <tr className="expanded-row">
                                                    <td colSpan="7">
                                                        <div className="details-panel">
                                                            <div className="detail-section">
                                                                <h4>Interview Remarks</h4>
                                                                <p>{interview.comments || 'No remarks provided'}</p>
                                                            </div>

                                                            {studentDetails[interview.studentId] && (() => {
                                                                const details = studentDetails[interview.studentId];
                                                                const { student: studentInfo, pv, tv, marks10, marks12 } = details;

                                                                return (
                                                                    <div className="student-details-content">
                                                                        <h4>Student Details</h4>
                                                                        <div className="info-grid">
                                                                            <div className="info-item">
                                                                                <strong>Address:</strong> {studentInfo?.address || 'N/A'}
                                                                            </div>
                                                                            <div className="info-item">
                                                                                <strong>Email:</strong> {studentInfo?.email || 'N/A'}
                                                                            </div>
                                                                            <div className="info-item">
                                                                                <strong>Phone:</strong> {studentInfo?.phone || 'N/A'}
                                                                            </div>
                                                                            <div className="info-item">
                                                                                <strong>Annual Income:</strong> {studentInfo?.income || 'N/A'}
                                                                            </div>
                                                                        </div>

                                                                        {tv && (
                                                                            <div className="section-box">
                                                                                <h5>TV Verification</h5>
                                                                                <p><strong>Status:</strong> {tv.status || 'N/A'}</p>
                                                                                {tv.comments && <p><strong>Comments:</strong> {tv.comments}</p>}
                                                                            </div>
                                                                        )}

                                                                        {pv && (
                                                                            <div className="section-box">
                                                                                <h5>PV Verification</h5>
                                                                                <p><strong>Recommendation:</strong> {pv.recommendation || 'N/A'}</p>
                                                                                <p><strong>Sentiment Score:</strong> {pv.sentiment_text || 'N/A'}%</p>
                                                                                {pv.comment && <p><strong>Comments:</strong> {pv.comment}</p>}
                                                                            </div>
                                                                        )}

                                                                        {(marks10 || marks12) && (
                                                                            <div className="section-box">
                                                                                <h5>Academic Performance</h5>
                                                                                {marks10 && <p><strong>10th Total:</strong> {marks10.total}/500</p>}
                                                                                {marks12 && (
                                                                                    <>
                                                                                        <p><strong>12th Total:</strong> {marks12.total}/600</p>
                                                                                        <p><strong>Cutoff:</strong> {marks12.cutoff}</p>
                                                                                    </>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })()}
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
            </main>
        </div>
    );
};

export default VICompletedInterviewsPage;
