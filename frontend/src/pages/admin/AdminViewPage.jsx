import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './AdminViewPage.css';

const AdminViewPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();

    // State
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [decision, setDecision] = useState('');
    const [remarks, setRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadData();
    }, [studentId]);

    const loadData = async () => {
        try {
            const response = await adminService.getStudentDetails(studentId);
            setData(response);
        } catch (error) {
            console.error('Error loading student details:', error);
            alert('Failed to load student details');
            navigate('/admin/dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!decision) return alert('Please select a decision');

        setSubmitting(true);
        try {
            const result = await adminService.submitFinalDecision(studentId, decision, remarks);
            if (result.success) {
                alert('Decision saved successfully!');
                navigate('/admin/dashboard');
            } else {
                alert('Error submitting decision: ' + result.error);
            }
        } catch (error) {
            console.error(error);
            alert('System error during submission');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading">Loading details...</div>;
    if (!data) return <div className="error">Student not found</div>;

    const { student, pv, tv, audio_url, images, collective_analysis, marks10, marks12 } = data;
    const sentimentScore = parseFloat(pv?.sentiment_text || 0);

    // Debug logging
    console.log('Admin View Data:', data);
    console.log('Marks10:', marks10);
    console.log('Marks12:', marks12);

    return (
        <div className="admin-view-page">
            <header className="header-with-logout">
                <button
                    onClick={() => {
                        authService.logout();
                        navigate('/login');
                    }}
                    className="logout-btn-right"
                >
                    Logout
                </button>
                <div className="header-center-content">
                    <img src={logo} alt="Logo" className="header-logo-center" />
                    <div className="header-title-center">Admin - Student Verification Review</div>
                </div>
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

                {/* 2. Student Marks - Only show if data exists */}
                {(marks10 || marks12) && (
                    <div className="section-box">
                        <div className="section-title">Academic Performance</div>

                        {/* 10th Marks Table */}
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
                                        {['tamil', 'english', 'maths', 'science', 'social'].map((subject, index) => (
                                            <tr key={subject} style={{ animationDelay: `${index * 0.1}s` }} className="animated-row">
                                                <td style={{ textTransform: 'capitalize' }}>{subject}</td>
                                                <td className="font-bold">{marks10?.[subject] || '-'}</td>
                                                <td><span className="pass-badge">Pass</span></td>
                                            </tr>
                                        ))}
                                        <tr className="total-row animated-row" style={{ animationDelay: '0.6s' }}>
                                            <td><strong>Total</strong></td>
                                            <td colSpan="2"><strong>{marks10?.total || '-'} / 500</strong></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* 12th Marks Table */}
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
                                        {['tamil', 'english', 'maths', 'physics', 'chemistry'].map((subject, index) => (
                                            <tr key={subject} style={{ animationDelay: `${index * 0.1}s` }} className="animated-row">
                                                <td style={{ textTransform: 'capitalize' }}>{subject}</td>
                                                <td className="font-bold">{marks12?.[subject] || '-'}</td>
                                                <td><span className="pass-badge">Pass</span></td>
                                            </tr>
                                        ))}
                                        <tr className="total-row animated-row" style={{ animationDelay: '0.6s' }}>
                                            <td><strong>Total</strong></td>
                                            <td colSpan="2"><strong>{marks12?.total || '-'} / 600</strong></td>
                                        </tr>
                                        <tr className="cutoff-row animated-row" style={{ animationDelay: '0.7s' }}>
                                            <td><strong>Cutoff</strong></td>
                                            <td colSpan="2" className="cutoff-value">{marks12?.cutoff || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Volunteer Comment - Separate Section */}
                <div className="section-box">
                    <div className="section-title">Volunteer Comment</div>
                    <div className="input-style-box">{pv?.comment || 'No comment available.'}</div>
                </div>

                {/* 4. PV Report */}
                <div className="section-box">
                    <div className="section-title">Physical Verification Report</div>

                    {/* Audio Player First */}
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

                    {/* AI Summary as Bullet Points */}
                    <div className="info-item" style={{ marginTop: '20px' }}>
                        <div className="info-label">AI Summary</div>
                        <div className="ai-summary-points">
                            {pv?.elementsSummary ? (
                                (() => {
                                    // Clean the summary text
                                    let cleanedSummary = pv.elementsSummary
                                        .replace(/TEXT\/AUDIO SUMMARY:\s*/gi, '') // Remove prefix
                                        .replace(/^\s*;\s*/, '') // Remove leading semicolon
                                        .trim();

                                    // Split into sentences and filter
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
                            <div className="info-label">Volunteer Recommendation</div>
                            <span className={`badge ${pv?.status === 'SELECT' ? 'green' :
                                pv?.status === 'REJECT' ? 'red' : 'orange'
                                }`}>
                                {pv?.status}
                            </span>
                        </div>
                    </div>
                </div>

                {/* House Images */}
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

                {/* Admin Decision */}
                <div className="decision-box">
                    <div className="decision-title">Admin Final Decision</div>
                    <select
                        className="decision-select"
                        value={decision}
                        onChange={(e) => setDecision(e.target.value)}
                    >
                        <option value="">-- Select Status --</option>
                        <option value="APPROVED">APPROVED</option>
                        <option value="REJECTED">REJECTED</option>
                    </select>
                    <br />
                    <textarea
                        className="decision-remarks"
                        placeholder="Add remarks (optional)..."
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows="4"
                    />
                    <br />
                    <button
                        className="decision-btn"
                        onClick={handleSubmit}
                        disabled={!decision || submitting}
                    >
                        {submitting ? 'Saving...' : 'Update Decision'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AdminViewPage;
