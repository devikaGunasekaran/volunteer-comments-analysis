import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, ClipboardList, CheckCircle, ArrowLeft } from 'lucide-react';
import viVolunteerService from '../../services/viVolunteerService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './VIAssignedStudentsPage.css';
import ScheduleInterviewModal from '../../components/vi/ScheduleInterviewModal';

const VIAssignedStudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedRow, setExpandedRow] = useState(null);
    const [studentDetails, setStudentDetails] = useState({});
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedStudentForSchedule, setSelectedStudentForSchedule] = useState(null);

    const navigate = useNavigate();
    const currentUser = authService.getCurrentUser(); // Get logged in volunteer info

    useEffect(() => {
        loadAssignedStudents();
    }, []);

    const loadAssignedStudents = async () => {
        try {
            setLoading(true);
            const data = await viVolunteerService.getAssignedStudents();
            const studentsList = data.students || [];
            // Only show PENDING (active) students in this list
            const activeStudents = studentsList.filter(s => s.status === 'PENDING');
            setStudents(activeStudents);
        } catch (error) {
            console.error('Error loading assigned students:', error);
            if (error.response && error.response.status === 401) {
                authService.logout();
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const openScheduleModal = (student, e) => {
        e.stopPropagation(); // Prevent row toggle
        setSelectedStudentForSchedule(student);
        setShowScheduleModal(true);
    };

    const handleScheduleSuccess = (meetingData) => {
        // Optional: Update student status or show notification
        console.log('Meeting scheduled:', meetingData);
        // You could refresh the list here if needed
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
                        className="nav-item active"
                        onClick={() => navigate('/vi/assigned')}
                    >
                        <span className="icon"><ClipboardList size={18} /></span> My Assignments
                    </button>
                    <button
                        className="nav-item"
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
                    <h2>Pending Interviews</h2>
                    <button onClick={() => navigate('/vi/dashboard')} className="back-btn">
                        <ArrowLeft size={18} style={{ marginRight: 6 }} /> Back to Dashboard
                    </button>
                </div>

                <div className="table-wrapper">
                    {loading ? (
                        <div className="loading-state">Loading students...</div>
                    ) : students.length === 0 ? (
                        <div className="empty-state">No pending students assigned for VI yet.</div>
                    ) : (
                        <table className="custom-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Student ID</th>
                                    <th>Name</th>
                                    <th>District</th>
                                    <th>Phone</th>
                                    <th>Assigned Date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student, index) => (
                                    <React.Fragment key={student.studentId}>
                                        <tr>
                                            <td>{index + 1}</td>
                                            <td
                                                className="clickable-id"
                                                onClick={() => toggleRow(student.studentId)}
                                                style={{ cursor: 'pointer', color: '#0066cc' }}
                                                title="Click to view details"
                                            >
                                                {student.studentId}
                                            </td>
                                            <td>{student.name}</td>
                                            <td>{student.district}</td>
                                            <td>{student.phone}</td>
                                            <td>
                                                {student.assignedDate
                                                    ? new Date(student.assignedDate).toLocaleDateString()
                                                    : 'N/A'
                                                }
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="action-btn secondary"
                                                        onClick={(e) => openScheduleModal(student, e)}
                                                        style={{
                                                            backgroundColor: '#10B981',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '6px 12px',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Schedule Meet
                                                    </button>
                                                    <button
                                                        className="action-btn"
                                                        onClick={() => navigate(`/vi/interview/${student.studentId}`)}
                                                    >
                                                        Details →
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRow === student.studentId && studentDetails[student.studentId] && (
                                            <tr className="expanded-row">
                                                <td colSpan="7">
                                                    <div className="details-panel">
                                                        {(() => {
                                                            const details = studentDetails[student.studentId];
                                                            const { student: studentInfo, pv, tv, marks10, marks12 } = details;

                                                            return (
                                                                <div className="student-details-content">
                                                                    <h3>Student Details</h3>
                                                                    <div className="info-grid">
                                                                        <div className="info-item">
                                                                            <strong>Address:</strong> {studentInfo?.address || 'N/A'}
                                                                        </div>
                                                                        <div className="info-item">
                                                                            <strong>Email:</strong> {studentInfo?.email || 'N/A'}
                                                                        </div>
                                                                        <div className="info-item">
                                                                            <strong>Annual Income:</strong> {studentInfo?.income || 'N/A'}
                                                                        </div>
                                                                    </div>

                                                                    {tv && (
                                                                        <div className="section-box">
                                                                            <h4>TV Verification</h4>
                                                                            <p><strong>Status:</strong> {tv.status || 'N/A'}</p>
                                                                            {tv.comments && <p><strong>Comments:</strong> {tv.comments}</p>}
                                                                        </div>
                                                                    )}

                                                                    {pv && (
                                                                        <div className="section-box">
                                                                            <h4>PV Verification</h4>
                                                                            <p><strong>Recommendation:</strong> {pv.recommendation || 'N/A'}</p>
                                                                            <p><strong>Sentiment Score:</strong> {pv.sentiment_text || 'N/A'}%</p>
                                                                            {pv.comment && <p><strong>Comments:</strong> {pv.comment}</p>}
                                                                        </div>
                                                                    )}

                                                                    {(marks10 || marks12) && (
                                                                        <div className="section-box">
                                                                            <h4>Academic Performance</h4>
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

                {/* Schedule Interview Modal */}
                {showScheduleModal && selectedStudentForSchedule && (
                    <ScheduleInterviewModal
                        student={selectedStudentForSchedule}
                        volunteerId={currentUser?.volunteerId} // Matches backend response
                        onClose={() => setShowScheduleModal(false)}
                        onScheduleSuccess={handleScheduleSuccess}
                    />
                )}
            </main>
        </div>
    );
};

export default VIAssignedStudentsPage;
