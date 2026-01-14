import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, Users, Clock, CheckCircle } from 'lucide-react';
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
    const [showTranslationDetails, setShowTranslationDetails] = useState(false);  // Toggle for translation breakdown

    useEffect(() => {
        loadData();
    }, [studentId, navigate]);

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

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
        <div className="admin-layout">
            {/* Sidebar Navigation */}
            <nav className="side-nav">
                <div className="nav-logo">
                    <img src={logo} alt="Matram Logo" className="header-logo-center" />
                    <span>PV Admin Panel</span>
                </div>

                <div className="nav-links">
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/dashboard')}
                    >
                        <span className="icon"><Home size={18} /></span> Overview
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/assign')}
                    >
                        <span className="icon"><Users size={18} /></span> Assign Volunteers
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/reviews')}
                    >
                        <span className="icon"><Clock size={18} /></span> Pending Reviews
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/pv-students')}
                    >
                        <span className="icon"><CheckCircle size={18} /></span> Completed PV
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
                <div className="admin-view-page">
                    <div className="section-header-row">
                        <h3>Student Verification Details</h3>
                        <p className="section-subtitle">Review PV report and AI analysis for decision making</p>
                    </div>

                    <div className="view-container" style={{ margin: 0, padding: 0, maxWidth: '100%' }}>

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
                            <div className="section-title">Volunteer Comment (AI Translated to English)</div>
                            <div className="input-style-box">{pv?.comment || 'No comment available.'}</div>
                        </div>

                        {/* 3b. Original Volunteer Input - Tanglish/English */}
                        {pv?.original_comment && (
                            <div className="section-box" style={{ backgroundColor: '#FFF9E6', borderLeft: '4px solid #FFB800' }}>
                                <div className="section-title" style={{ color: '#B8860B' }}>
                                    📝 Original Volunteer Input (Tanglish/English)
                                </div>
                                <div className="input-style-box" style={{ backgroundColor: '#FFFEF7', fontStyle: 'italic', color: '#555' }}>
                                    {pv.original_comment}
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '12px', color: '#888', fontStyle: 'italic' }}>
                                    ℹ️ This is the volunteer's original input before AI translation
                                </div>
                            </div>
                        )}

                        {/* 3c. Translation Breakdown - Toggle Button */}
                        {(pv?.text_translation || pv?.audio_translation) && (
                            <div className="section-box" style={{ backgroundColor: '#F0F9FF', borderLeft: '4px solid #3B82F6' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                    <div className="section-title" style={{ margin: 0, color: '#1E40AF' }}>
                                        🔍 Translation Breakdown
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowTranslationDetails(!showTranslationDetails)}
                                        style={{
                                            padding: '8px 16px',
                                            backgroundColor: showTranslationDetails ? '#3B82F6' : '#E0F2FE',
                                            color: showTranslationDetails ? 'white' : '#1E40AF',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {showTranslationDetails ? '▼ Hide Details' : '▶ Show Details'}
                                    </button>
                                </div>

                                {showTranslationDetails && (
                                    <div style={{ marginTop: '16px' }}>
                                        {/* Text Comment Translation */}
                                        {pv.text_translation && (
                                            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#DBEAFE', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E40AF', marginBottom: '8px' }}>
                                                    📝 Text Comment → English:
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#1E3A8A', lineHeight: '1.6' }}>
                                                    {pv.text_translation}
                                                </div>
                                            </div>
                                        )}

                                        {/* Audio Translation */}
                                        {pv.audio_translation && (
                                            <div style={{ padding: '12px', backgroundColor: '#DBEAFE', borderRadius: '6px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#1E40AF', marginBottom: '8px' }}>
                                                    🎤 Audio → English:
                                                </div>
                                                <div style={{ fontSize: '14px', color: '#1E3A8A', lineHeight: '1.6' }}>
                                                    {pv.audio_translation}
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ marginTop: '12px', fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>
                                            ℹ️ These are individual AI translations before merging
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

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
            </main>
        </div>
    );
};

export default AdminViewPage;
