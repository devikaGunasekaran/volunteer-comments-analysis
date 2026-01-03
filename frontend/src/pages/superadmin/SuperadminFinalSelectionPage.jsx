import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import superadminService from '../../services/superadminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './SuperadminFinalSelectionPage.css';

const SuperadminFinalSelectionPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [decision, setDecision] = useState('');
    const [remarks, setRemarks] = useState('');
    // const [riTechnicalScore, setRiTechnicalScore] = useState(''); // Removed
    // const [riCommunicationScore, setRiCommunicationScore] = useState(''); // Removed
    const [riRecommendation, setRiRecommendation] = useState('');
    const [riRemarks, setRiRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [expandedRow, setExpandedRow] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        loadStudents();
    }, []);

    const loadStudents = async () => {
        try {
            setLoading(true);
            const data = await superadminService.getStudentsForFinalDecision();
            setStudents(data.students || []);
        } catch (error) {
            console.error('Error loading students:', error);
            alert('Failed to load students. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const openDecisionModal = (student) => {
        setSelectedStudent(student);
        setDecision('');
        setRemarks('');
        setRiTechnicalScore('');
        setRiCommunicationScore('');
        setRiRecommendation('');
        setRiRemarks('');
    };

    const closeDecisionModal = () => {
        setSelectedStudent(null);
        setDecision('');
        setRemarks('');
        setRiTechnicalScore('');
        setRiCommunicationScore('');
        setRiRecommendation('');
        setRiRemarks('');
    };

    const handleSubmitDecision = async () => {
        if (!decision) {
            alert('Please select a decision (SELECTED or REJECTED)');
            return;
        }
        if (!remarks.trim()) {
            alert('Please provide remarks for your decision');
            return;
        }

        setSubmitting(true);
        try {
            const result = await superadminService.submitFinalDecision(
                selectedStudent.studentId,
                decision,
                remarks,
                {
                    technicalScore: 0, // Defaulting to 0 since removed from UI
                    communicationScore: 0, // Defaulting to 0
                    recommendation: riRecommendation,
                    riRemarks: riRemarks
                }
            );

            if (result.success) {
                alert(result.message || 'Final decision submitted successfully!');
                closeDecisionModal();

                // If student is SELECTED, redirect to educational details form
                if (decision === 'SELECTED') {
                    navigate('/superadmin/educational-details', {
                        state: { student: selectedStudent }
                    });
                } else {
                    // If REJECTED, just reload the list
                    loadStudents();
                }
            }
        } catch (error) {
            console.error('Decision submission failed:', error);
            alert('Failed to submit decision. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleRow = (studentId) => {
        setExpandedRow(expandedRow === studentId ? null : studentId);
    };

    return (
        <div className="superadmin-final-selection-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Final Scholarship Selection</div>
            </header>

            <div className="container">
                <div className="page-header">
                    <h2>Make Final Scholarship Decision</h2>
                    <div className="header-actions">
                        <button
                            onClick={() => navigate('/superadmin/selected-students')}
                            className="view-completed-btn"
                        >
                            📋 View All Decisions
                        </button>
                        <button
                            onClick={() => navigate('/superadmin/dashboard')}
                            className="back-btn"
                        >
                            ← Back to Dashboard
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner">Loading...</div>
                    </div>
                ) : students.length === 0 ? (
                    <div className="no-data">
                        No students pending final decision
                    </div>
                ) : (
                    <div className="table-container">
                        <table className="students-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>District</th>
                                    <th>RI Volunteer</th>
                                    <th>Details</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, index) => (
                                    <React.Fragment key={student.studentId}>
                                        <tr>
                                            <td>{index + 1}</td>
                                            <td className="student-id">{student.studentId}</td>
                                            <td>{student.name}</td>
                                            <td>{student.district}</td>
                                            <td>
                                                <div className="volunteer-info">
                                                    <div className="volunteer-name">{student.ri_volunteer_name || 'Assigned'}</div>
                                                    <div className="volunteer-email">{student.ri_volunteer_email || 'N/A'}</div>
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    className="details-btn"
                                                    onClick={() => toggleRow(student.studentId)}
                                                >
                                                    {expandedRow === student.studentId ? '▲ Hide' : '▼ Show'}
                                                </button>
                                            </td>
                                            <td>
                                                <button
                                                    className="decide-btn"
                                                    onClick={() => openDecisionModal(student)}
                                                >
                                                    Make Decision
                                                </button>
                                            </td>
                                        </tr>
                                        {expandedRow === student.studentId && (
                                            <tr className="expanded-row">
                                                <td colSpan="7">
                                                    <div className="details-panel">
                                                        <h3 className="journey-title">Complete Student Journey</h3>

                                                        {/* Student Status */}
                                                        <div className="journey-section">
                                                            <h4>📋 Student Status</h4>
                                                            <div className="detail-grid">
                                                                <div className="detail-item">
                                                                    <label>Current Status:</label>
                                                                    <span className={`badge ${student.student_status?.toLowerCase()}`}>
                                                                        {student.student_status || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Physical Verification */}
                                                        <div className="journey-section">
                                                            <h4>🏠 Physical Verification (PV)</h4>
                                                            <div className="detail-grid">
                                                                <div className="detail-item">
                                                                    <label>PV Volunteer:</label>
                                                                    <span>{student.pv_volunteer_name || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <label>Verification Date:</label>
                                                                    <span>
                                                                        {student.pv_date
                                                                            ? new Date(student.pv_date).toLocaleDateString()
                                                                            : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <label>PV Recommendation:</label>
                                                                    <span className={`badge ${student.pv_recommendation?.toLowerCase()}`}>
                                                                        {student.pv_recommendation || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {student.pv_comments && (
                                                                <div className="remarks-section">
                                                                    <strong>PV Comments:</strong>
                                                                    <p>{student.pv_comments}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="journey-section">
                                                            <h4>💻 Virtual Interview (VI)</h4>
                                                            <div className="detail-grid">
                                                                <div className="detail-item">
                                                                    <label>VI Volunteer:</label>
                                                                    <span>{student.vi_volunteer_name || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <label>VI Recommendation:</label>
                                                                    <span className="badge vi">
                                                                        {student.vi_recommendation || 'N/A'}
                                                                    </span>
                                                                </div>
                                                                {/* Scores removed */}
                                                            </div>
                                                            {student.vi_comments && (
                                                                <div className="remarks-section">
                                                                    <strong>VI Comments:</strong>
                                                                    <p>{student.vi_comments}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Telephonic Verification */}
                                                        <div className="journey-section">
                                                            <h4>📞 Telephonic Verification (TV)</h4>
                                                            <div className="detail-grid">
                                                                <div className="detail-item">
                                                                    <label>TV Volunteer:</label>
                                                                    <span>{student.tv_volunteer_name || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <label>Verification Date:</label>
                                                                    <span>
                                                                        {student.tv_date
                                                                            ? new Date(student.tv_date).toLocaleDateString()
                                                                            : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <label>TV Status:</label>
                                                                    <span className={`badge ${student.tv_status?.toLowerCase()}`}>
                                                                        {student.tv_status || 'N/A'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {student.tv_comments && (
                                                                <div className="remarks-section">
                                                                    <strong>TV Comments:</strong>
                                                                    <p>{student.tv_comments}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Real Interview */}
                                                        <div className="journey-section">
                                                            <h4>🎯 Real Interview (RI)</h4>
                                                            <div className="detail-grid">
                                                                <div className="detail-item">
                                                                    <label>RI Volunteer:</label>
                                                                    <span>{student.ri_volunteer_name || 'Assigned'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <label>Assigned Date:</label>
                                                                    <span>
                                                                        {student.ri_assigned_date
                                                                            ? new Date(student.ri_assigned_date).toLocaleDateString()
                                                                            : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                {student.ri_recommendation && (
                                                                    <div className="detail-item">
                                                                        <label>RI Recommendation:</label>
                                                                        <span className="badge ri">
                                                                            {student.ri_recommendation}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {/* Scores removed */}
                                                            </div>
                                                            {student.ri_remarks && (
                                                                <div className="remarks-section">
                                                                    <strong>RI Remarks:</strong>
                                                                    <p>{student.ri_remarks}</p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Contact Information */}
                                                        <div className="journey-section">
                                                            <h4>📞 Contact Information</h4>
                                                            <div className="detail-grid">
                                                                <div className="detail-item">
                                                                    <label>Phone:</label>
                                                                    <span>{student.phone || 'N/A'}</span>
                                                                </div>
                                                                <div className="detail-item">
                                                                    <label>Email:</label>
                                                                    <span>{student.email || 'N/A'}</span>
                                                                </div>
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

            {/* Decision Modal */}
            {
                selectedStudent && (
                    <div className="modal-overlay" onClick={closeDecisionModal}>
                        <div className="modal-content decision-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Final Scholarship Decision for {selectedStudent.name}</h3>
                                <button className="close-btn" onClick={closeDecisionModal}>×</button>
                            </div>
                            <div className="modal-body">
                                <div className="student-summary">
                                    <p><strong>Student ID:</strong> {selectedStudent.studentId}</p>
                                    <p><strong>District:</strong> {selectedStudent.district}</p>
                                    <p><strong>VI Recommendation:</strong> {selectedStudent.vi_recommendation || 'N/A'}</p>
                                    <p><strong>RI Recommendation:</strong> {selectedStudent.ri_recommendation || 'N/A'}</p>
                                </div>

                                <div className="form-section">
                                    <h4 className="section-subtitle">Real Interview Details (From Paper Record)</h4>
                                    <div className="form-row">
                                        {/* Scores removed */}
                                    </div>
                                    <div className="form-group">
                                        <label>RI Recommendation</label>
                                        <select
                                            value={riRecommendation}
                                            onChange={(e) => setRiRecommendation(e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="">-- Select Recommendation --</option>
                                            <option value="STRONG_YES">Strong Yes</option>
                                            <option value="SELECTED">Selected</option>
                                            <option value="YES">Yes</option>
                                            <option value="MAYBE">Maybe</option>
                                            <option value="NO">No</option>
                                            <option value="REJECTED">Rejected</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>RI Remarks</label>
                                        <textarea
                                            value={riRemarks}
                                            onChange={(e) => setRiRemarks(e.target.value)}
                                            placeholder="Enter remarks from RI paper record..."
                                            className="form-textarea"
                                            rows="3"
                                        />
                                    </div>
                                </div>

                                <div className="form-section">
                                    <label className="required">Final Scholarship Decision</label>
                                    <div className="decision-buttons">
                                        <button
                                            className={`decision-option selected-option ${decision === 'SELECTED' ? 'active' : ''}`}
                                            onClick={() => setDecision('SELECTED')}
                                        >
                                            ✅ SELECT for Scholarship
                                        </button>
                                        <button
                                            className={`decision-option rejected-option ${decision === 'REJECTED' ? 'active' : ''}`}
                                            onClick={() => setDecision('REJECTED')}
                                        >
                                            ❌ REJECT for Scholarship
                                        </button>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <label className="required">Decision Remarks</label>
                                    <textarea
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Provide detailed remarks explaining your decision..."
                                        className="remarks-textarea"
                                        rows="4"
                                    />
                                </div>

                                <button
                                    className="submit-decision-btn"
                                    onClick={handleSubmitDecision}
                                    disabled={submitting || !decision || !remarks.trim()}
                                >
                                    {submitting ? 'Submitting...' : 'Submit Final Decision'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default SuperadminFinalSelectionPage;
