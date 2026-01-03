import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './AdminViewPage.css'; // Use shared admin styles

const TVReportDetailsPage = () => {
    const { studentId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [decision, setDecision] = useState('');
    const [remarks, setRemarks] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || (user.role !== 'admin' && user.role !== 'tv_admin')) {
            navigate('/login');
            return;
        }
        fetchDetails();
    }, [studentId, navigate]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const result = await adminService.getStudentDetails(studentId);
            setData(result);
        } catch (error) {
            console.error('Error fetching details:', error);
            alert('Failed to load student details');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleSubmitDecision = async () => {
        if (!decision) return alert('Please select a decision');

        setSubmitting(true);
        try {
            // Map Validated Status to Backend specific string
            // Approved -> SELECT (Move to PV)
            // Rejected -> REJECT (Reject Application)
            const apiDecision = decision === 'APPROVED' ? 'SELECT' : 'REJECT';

            const result = await adminService.reviewTVSubmission(studentId, apiDecision, remarks);
            if (result.success) {
                alert(`Decision submitted: Student moved to ${decision === 'APPROVED' ? 'PV' : 'REJECTED'}`);
                navigate('/admin/tv-reports');
            } else {
                alert('Submission failed: ' + result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred.');
        } finally {
            setSubmitting(false);
        }
    };

    const parseTVFeedback = (feedback) => {
        if (!feedback) return { comments: '', suggestion: '' };

        const suggestionMarker = 'Volunteer Suggestion:';
        if (feedback.includes(suggestionMarker)) {
            const parts = feedback.split(suggestionMarker);
            const commentsPart = parts[0].replace('Comments:', '').trim();
            const suggestionPart = parts[1].trim();
            return { comments: commentsPart, suggestion: suggestionPart };
        }

        return { comments: feedback, suggestion: '' };
    };

    if (loading) return <div className="loading">Loading details...</div>;

    if (!data || !data.student) return (
        <div className="admin-view-page">
            <header className="header-with-logout">
                <button onClick={handleLogout} className="logout-btn-right">LOGOUT</button>
                <div className="header-center-content">
                    <img src={logo} alt="Logo" className="header-logo-center" />
                    <div className="header-title-center">TV - Student Details</div>
                </div>
            </header>
            <div className="view-container">
                <div className="error-container">
                    <p>Data not found for Student ID: {studentId}</p>
                </div>
            </div>
        </div>
    );

    const { student, tv, marks10, marks12 } = data;
    const feedback = parseTVFeedback(tv?.comments);

    return (
        <div className="admin-view-page">
            <header className="header-with-logout">
                <button onClick={handleLogout} className="logout-btn-right">LOGOUT</button>
                <div className="header-center-content">
                    <img src={logo} alt="Logo" className="header-logo-center" />
                    <div className="header-title-center">TV - Student Verification Review</div>
                </div>
            </header>

            <div className="view-container">

                {/* 1. Student Details */}
                <div className="section-box">
                    <div className="section-title">Student Details</div>
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-label">Application ID</div>
                            <div className="info-value">{studentId}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Name</div>
                            <div className="info-value">{student.name}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">District</div>
                            <div className="info-value">{student.district}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Phone</div>
                            <div className="info-value">{student.phone}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Email</div>
                            <div className="info-value">{student.email || 'N/A'}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Gender</div>
                            <div className="info-value">{student.gender || 'N/A'}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Father's Name</div>
                            <div className="info-value">{student.fatherName || student.father || 'N/A'}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Mother's Name</div>
                            <div className="info-value">{student.motherName || student.mother || 'N/A'}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Annual Income</div>
                            <div className="info-value">{student.income || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                {/* 2. Academic Performance */}
                {(marks10 || marks12) && (
                    <div className="section-box">
                        <div className="section-title">Academic Performance</div>

                        {marks10 && (
                            <div className="marks-table-container">
                                <h4 className="marks-title">10th Standard</h4>
                                <table className="marks-table">
                                    <thead>
                                        <tr><th>Subject</th><th>Marks</th></tr>
                                    </thead>
                                    <tbody>
                                        {['Tamil', 'English', 'Maths', 'Science', 'Social'].map(sub => (
                                            <tr key={sub}>
                                                <td>{sub}</td>
                                                <td className="font-bold">{marks10[sub.toLowerCase()] || '-'}</td>
                                            </tr>
                                        ))}
                                        <tr className="total-row">
                                            <td><strong>Total</strong></td>
                                            <td><strong>{marks10.total || '-'} / 500</strong></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {marks12 && (
                            <div className="marks-table-container" style={{ marginTop: '24px' }}>
                                <h4 className="marks-title">12th Standard</h4>
                                <table className="marks-table">
                                    <thead>
                                        <tr><th>Subject</th><th>Marks</th></tr>
                                    </thead>
                                    <tbody>
                                        {['Tamil', 'English', 'Maths', 'Physics', 'Chemistry'].map(sub => (
                                            <tr key={sub}>
                                                <td>{sub}</td>
                                                <td className="font-bold">{marks12[sub.toLowerCase()] || '-'}</td>
                                            </tr>
                                        ))}
                                        <tr className="total-row">
                                            <td><strong>Total</strong></td>
                                            <td><strong>{marks12.total || '-'} / 600</strong></td>
                                        </tr>
                                        <tr className="cutoff-row">
                                            <td><strong>Cutoff</strong></td>
                                            <td className="cutoff-value">{marks12.cutoff || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Televerification Report */}
                <div className="section-box">
                    <div className="section-title">Televerification Report</div>

                    <div className="info-grid" style={{ marginBottom: '20px' }}>
                        <div className="info-item">
                            <div className="info-label">Verification Status</div>
                            <span className={`badge ${tv?.status === 'VERIFIED' ? 'green' :
                                    tv?.status === 'REJECTED' ? 'red' : 'orange'
                                }`}>
                                {tv?.status || 'PENDING'}
                            </span>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Volunteer Recommendation</div>
                            <span className={`badge ${feedback.suggestion === 'Select' ? 'green' :
                                    feedback.suggestion === 'Reject' ? 'red' : 'orange'
                                }`}>
                                {feedback.suggestion || 'None'}
                            </span>
                        </div>
                    </div>

                    <div>
                        <div className="info-label">Call Comments</div>
                        <div className="input-style-box">{feedback.comments || 'No comments provided.'}</div>
                    </div>
                </div>

                {/* 5. Admin Decision */}
                <div className="decision-box">
                    <div className="decision-title">Admin Final Decision</div>
                    <select
                        className="decision-select"
                        value={decision}
                        onChange={(e) => setDecision(e.target.value)}
                    >
                        <option value="">-- Select Status --</option>
                        <option value="APPROVED">APPROVED (Move to PV)</option>
                        <option value="REJECTED">REJECTED (Remove Application)</option>
                    </select>
                    <br />
                    <textarea
                        className="decision-remarks"
                        placeholder="Add remarks for this decision..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows="4"
                    />
                    <br />
                    <button
                        className="decision-btn"
                        onClick={handleSubmitDecision}
                        disabled={!decision || submitting}
                    >
                        {submitting ? 'Processing...' : 'Submit Decision'}
                    </button>
                    <div style={{ marginTop: '16px' }}>
                        <button
                            className="text-btn"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                textDecoration: 'underline',
                                cursor: 'pointer',
                                color: '#718096'
                            }}
                            onClick={() => navigate('/admin/tv-reports')}
                        >
                            Cancel / Return to List
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TVReportDetailsPage;
