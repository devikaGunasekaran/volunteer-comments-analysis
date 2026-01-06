import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import viVolunteerService from '../../services/viVolunteerService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './VIInterviewFormPage.css'; // Reusing form page styles

const VIStudentDetailsPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        loadStudentDetails();
    }, [studentId]);

    const loadStudentDetails = async () => {
        try {
            const response = await viVolunteerService.getStudentDetails(studentId);
            setData(response);
        } catch (error) {
            console.error('Error loading student details:', error);
            alert('Failed to load student details');
            navigate('/vi/completed');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) return <div className="loading">Loading student details...</div>;
    if (!data) return <div className="error">Student not found</div>;

    const { student, pv, audio_url, images, collective_analysis, marks10, marks12, vi_details } = data;
    const sentimentScore = parseFloat(pv?.sentiment_text || 0);

    return (
        <div className="vi-interview-form-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Student Details & Review</div>
            </header>

            <div className="view-container">
                {/* Back Button */}
                <div style={{ marginBottom: '20px' }}>
                    <button
                        onClick={() => navigate('/vi/completed')}
                        className="back-btn"
                        style={{ background: '#666', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        ← Back to List
                    </button>
                </div>

                {/* 1. Student Details */}
                <div className="section-box">
                    <div className="section-title">Student Details</div>
                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-label">Student ID</div>
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
                            <div className="info-label">Annual Income</div>
                            <div className="info-value">{student.income}</div>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Address</div>
                            <div className="info-value">{student.address}</div>
                        </div>
                    </div>
                </div>

                {/* 2. Academic Performance */}
                {(marks10 || marks12) && (
                    <div className="section-box">
                        <div className="section-title">Academic Performance</div>

                        {/* 10th Marks */}
                        {marks10 && (
                            <div className="marks-table-container">
                                <h4 className="marks-title">10th Standard</h4>
                                <table className="marks-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Marks</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {['tamil', 'english', 'maths', 'science', 'social'].map((subject) => (
                                            <tr key={subject}>
                                                <td style={{ textTransform: 'capitalize' }}>{subject}</td>
                                                <td className="font-bold">{marks10?.[subject] || '-'}</td>
                                                <td><span className="pass-badge">Pass</span></td>
                                            </tr>
                                        ))}
                                        <tr className="total-row">
                                            <td><strong>Total</strong></td>
                                            <td colSpan="2"><strong>{marks10?.total || '-'} / 500</strong></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 12th Marks */}
                        {marks12 && (
                            <div className="marks-table-container" style={{ marginTop: marks10 ? '24px' : '0' }}>
                                <h4 className="marks-title">12th Standard</h4>
                                <table className="marks-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Marks</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {['tamil', 'english', 'maths', 'physics', 'chemistry'].map((subject) => (
                                            <tr key={subject}>
                                                <td style={{ textTransform: 'capitalize' }}>{subject}</td>
                                                <td className="font-bold">{marks12?.[subject] || '-'}</td>
                                                <td><span className="pass-badge">Pass</span></td>
                                            </tr>
                                        ))}
                                        <tr className="total-row">
                                            <td><strong>Total</strong></td>
                                            <td colSpan="2"><strong>{marks12?.total || '-'} / 600</strong></td>
                                        </tr>
                                        <tr className="cutoff-row">
                                            <td><strong>Cutoff</strong></td>
                                            <td colSpan="2" className="cutoff-value">{marks12?.cutoff || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Volunteer Comment */}
                <div className="section-box">
                    <div className="section-title">PV Volunteer Comment</div>
                    <div className="input-style-box">{pv?.comment || 'No comment available.'}</div>
                </div>

                {/* 4. House Images */}
                <div className="section-box">
                    <div className="section-title">House Images & Analysis</div>

                    {images && images.length > 0 ? (
                        <div className="image-gallery">
                            {images.map((img, idx) => (
                                <div key={idx} className="image-card">
                                    <a href={img.url} target="_blank" rel="noopener noreferrer">
                                        <img src={img.url} alt="House" className="image-preview" />
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#777', fontStyle: 'italic' }}>No house images uploaded yet.</p>
                    )}
                </div>

                {/* 5. COMPLETED VI DECISION (Read Only) */}
                <div className="decision-box" style={{ borderLeft: '4px solid #FF6F00' }}>
                    <div className="decision-title" style={{ color: '#E65100' }}>✅ Completed Interview Review</div>

                    <div className="info-grid">
                        <div className="info-item">
                            <div className="info-label">Your Recommendation</div>
                            <span className={`badge ${vi_details?.overallRecommendation === 'YES' ? 'green' :
                                vi_details?.overallRecommendation === 'NO' ? 'red' : 'orange'}`}>
                                {vi_details?.overallRecommendation === 'YES' ? 'SELECT' :
                                    vi_details?.overallRecommendation === 'NO' ? 'REJECT' : 'ON HOLD'}
                            </span>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Interview Date</div>
                            <div className="info-value">
                                {vi_details?.interviewDate ? new Date(vi_details.interviewDate).toLocaleString() : 'N/A'}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <div className="info-label">Your Remarks</div>
                        <div className="input-style-box" style={{ background: '#f8fdf8', borderColor: '#c8e6c9' }}>
                            {vi_details?.comments || 'No remarks provided.'}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default VIStudentDetailsPage;
