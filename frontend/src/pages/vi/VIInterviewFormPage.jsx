import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import viVolunteerService from '../../services/viVolunteerService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './VIInterviewFormPage.css';

const VIInterviewFormPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [recommendation, setRecommendation] = useState('');
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

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
            navigate('/vi/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!recommendation) {
            return alert('Please select a recommendation');
        }

        if (!remarks || remarks.trim().length < 50) {
            return alert('Remarks must be at least 50 characters');
        }

        setSubmitting(true);
        try {
            const result = await viVolunteerService.submitInterview(
                studentId,
                recommendation,
                remarks
            );

            if (result.success) {
                alert('Interview submitted successfully!');
                navigate('/vi/dashboard');
            } else {
                alert('Error submitting interview: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('System error during submission');
        } finally {
            setSubmitting(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) return <div className="loading">Loading student details...</div>;
    if (!data) return <div className="error">Student not found</div>;

    const { student, pv, tv, audio_url, images, collective_analysis, marks10, marks12 } = data;
    const sentimentScore = parseFloat(pv?.sentiment_text || 0);

    return (
        <div className="vi-interview-form-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Virtual Interview - Student Review</div>
            </header>

            <div className="view-container">
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

                {/* 4. PV Report */}
                <div className="section-box">
                    <div className="section-title">Physical Verification Report</div>

                    {/* Audio Player */}
                    <div className="info-item">
                        <div className="info-label">🎤 PV Volunteer Audio Recording</div>
                        {audio_url ? (
                            <div className="audio-container">
                                <audio controls src={audio_url} />
                            </div>
                        ) : (
                            <div style={{ color: '#aaa', fontStyle: 'italic', marginTop: '5px' }}>
                                No audio recording available.
                            </div>
                        )}
                    </div>

                    {/* AI Summary */}
                    <div className="info-item" style={{ marginTop: '20px' }}>
                        <div className="info-label">AI Summary</div>
                        <div className="ai-summary-points">
                            {pv?.elementsSummary ? (
                                (() => {
                                    let cleanedSummary = pv.elementsSummary
                                        .replace(/TEXT\/AUDIO SUMMARY:\s*/gi, '')
                                        .replace(/^\s*;\s*/, '')
                                        .trim();

                                    const points = cleanedSummary
                                        .split(/[.!?]+/)
                                        .map(s => s.trim())
                                        .filter(s => s.length > 0);

                                    return points.length > 0 ? (
                                        points.map((point, idx) => (
                                            <div key={idx} className="summary-point">{point}</div>
                                        ))
                                    ) : (
                                        <div style={{ color: '#aaa', fontStyle: 'italic' }}>No AI summary available.</div>
                                    );
                                })()
                            ) : (
                                <div style={{ color: '#aaa', fontStyle: 'italic' }}>No AI summary available.</div>
                            )}
                        </div>
                    </div>

                    <div className="info-grid" style={{ marginTop: '20px' }}>
                        <div className="info-item">
                            <div className="info-label">Sentiment Result</div>
                            <span className={`badge ${sentimentScore >= 70 ? 'green' :
                                sentimentScore >= 40 ? 'orange' : 'red'
                                }`}>
                                {pv?.sentiment || 'Neutral'}
                            </span>
                        </div>
                        <div className="info-item">
                            <div className="info-label">Confidence Score</div>
                            <span className={`badge ${sentimentScore >= 70 ? 'green' :
                                sentimentScore >= 40 ? 'orange' : 'red'
                                }`}>
                                {Math.round(sentimentScore)}%
                            </span>
                        </div>
                        <div className="info-item">
                            <div className="info-label">PV Volunteer Recommendation</div>
                            <span className={`badge ${pv?.status === 'SELECT' ? 'green' :
                                pv?.status === 'REJECT' ? 'red' : 'orange'
                                }`}>
                                {pv?.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 5. House Images */}
                <div className="section-box">
                    <div className="section-title">House Images & Analysis</div>

                    {images && images.length > 0 ? (
                        <div className="image-gallery">
                            {images.map((img, idx) => (
                                <div key={idx} className="image-card">
                                    <a href={img.url} target="_blank" rel="noopener noreferrer">
                                        <img src={img.url} alt="House" className="image-preview" />
                                    </a>
                                    <div style={{ marginTop: '8px', fontSize: '12px', fontWeight: 'bold', color: '#555' }}>
                                        Condition: <span style={{
                                            color: img.condition === 'GOOD' ? 'green' :
                                                img.condition === 'POOR' ? 'red' : 'orange'
                                        }}>
                                            {img.condition || 'Analyzed'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ color: '#777', fontStyle: 'italic' }}>No house images uploaded yet.</p>
                    )}

                    {/* AI Analysis */}
                    {collective_analysis && collective_analysis.length > 0 && (
                        <div className="analysis-card">
                            <div className="analysis-header">✨ AI House Analysis</div>
                            <div className="analysis-content">
                                {collective_analysis.map((point, i) => (
                                    <div key={i} className="bullet-point">{point}</div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* 6. VI Interview Decision */}
                <div className="decision-box">
                    <div className="decision-title">Virtual Interview Decision</div>

                    <div className="recommendation-section">
                        <label className="recommendation-label">Final Recommendation *</label>
                        <div className="radio-group">
                            <label className="radio-option select-option">
                                <input
                                    type="radio"
                                    name="recommendation"
                                    value="SELECT"
                                    checked={recommendation === 'SELECT'}
                                    onChange={(e) => setRecommendation(e.target.value)}
                                />
                                <span className="radio-text">✅ SELECT</span>
                            </label>
                            <label className="radio-option reject-option">
                                <input
                                    type="radio"
                                    name="recommendation"
                                    value="REJECT"
                                    checked={recommendation === 'REJECT'}
                                    onChange={(e) => setRecommendation(e.target.value)}
                                />
                                <span className="radio-text">❌ REJECT</span>
                            </label>
                            <label className="radio-option hold-option">
                                <input
                                    type="radio"
                                    name="recommendation"
                                    value="ON HOLD"
                                    checked={recommendation === 'ON HOLD'}
                                    onChange={(e) => setRecommendation(e.target.value)}
                                />
                                <span className="radio-text">⏸️ ON HOLD</span>
                            </label>
                        </div>
                    </div>

                    <div className="remarks-section">
                        <label className="remarks-label">
                            Detailed Remarks * (minimum 50 characters)
                        </label>
                        <textarea
                            className="decision-remarks"
                            placeholder="Explain why you are selecting/rejecting/holding this student. Include observations from the interview, student's communication skills, technical knowledge, motivation, and any other relevant factors..."
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            rows="6"
                        />
                        <div className="char-count">
                            {remarks.length} / 50 characters minimum
                        </div>
                    </div>

                    <div className="button-group">
                        <button
                            className="back-btn"
                            onClick={() => navigate('/vi/dashboard')}
                        >
                            ← Back to Dashboard
                        </button>
                        <button
                            className="submit-btn"
                            onClick={handleSubmit}
                            disabled={!recommendation || remarks.trim().length < 50 || submitting}
                        >
                            {submitting ? 'Submitting...' : 'Submit Interview'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VIInterviewFormPage;
