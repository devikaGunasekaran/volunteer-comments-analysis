import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import realInterviewService from '../../services/realInterviewService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './SuperadminAssignRealInterviewPage.css';

const SuperadminAssignRealInterviewPage = () => {
    const [students, setStudents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedVolunteer, setSelectedVolunteer] = useState('');
    const [assigning, setAssigning] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [studentsData, volunteersData] = await Promise.all([
                realInterviewService.getEligibleStudents(),
                realInterviewService.getRIVolunteers()
            ]);

            setStudents(studentsData.students || []);
            setVolunteers(volunteersData.volunteers || []);
        } catch (error) {
            console.error('Error loading data:', error);
            alert('Failed to load data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const openAssignModal = (student) => {
        setSelectedStudent(student);
        setSelectedVolunteer(student.assigned_ri_volunteer_id || '');
    };

    const closeAssignModal = () => {
        setSelectedStudent(null);
        setSelectedVolunteer('');
    };

    const handleAssign = async () => {
        if (!selectedVolunteer) {
            alert('Please select a volunteer');
            return;
        }

        setAssigning(true);
        try {
            const result = await realInterviewService.assignVolunteer(
                selectedStudent.studentId,
                selectedVolunteer
            );

            if (result.success) {
                alert(result.message || 'RI volunteer assigned successfully!');
                closeAssignModal();
                loadData(); // Reload to show updated assignments
            }
        } catch (error) {
            console.error('Assignment failed:', error);
            alert('Failed to assign volunteer. Please try again.');
        } finally {
            setAssigning(false);
        }
    };

    const unassignedStudents = students.filter(s => !s.assigned_ri_volunteer_id);
    const assignedStudents = students.filter(s => s.assigned_ri_volunteer_id);

    return (
        <div className="superadmin-assign-ri-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Assign Real Interview Volunteers</div>
            </header>

            <div className="container">
                <div className="page-header">
                    <h2>Real Interview Assignment</h2>
                    <div className="header-actions">
                        <button
                            onClick={() => navigate('/superadmin/real-interview-students')}
                            className="view-completed-btn"
                        >
                            📋 View Completed RIs
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
                ) : (
                    <>
                        {/* Unassigned Students */}
                        <div className="section-card">
                            <h3 className="section-title">
                                Students Awaiting RI Assignment ({unassignedStudents.length})
                            </h3>
                            {unassignedStudents.length === 0 ? (
                                <div className="no-data">All VI-selected students have been assigned!</div>
                            ) : (
                                <div className="table-container">
                                    <table className="students-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Student ID</th>
                                                <th>Name</th>
                                                <th>District</th>
                                                <th>VI Volunteer</th>
                                                <th>VI Date</th>
                                                <th>VI Recommendation</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {unassignedStudents.map((student, index) => (
                                                <tr key={student.studentId}>
                                                    <td>{index + 1}</td>
                                                    <td className="student-id">{student.studentId}</td>
                                                    <td>{student.name}</td>
                                                    <td>{student.district}</td>
                                                    <td>
                                                        <div className="volunteer-info">
                                                            <div className="volunteer-name">{student.vi_volunteer_name}</div>
                                                            <div className="volunteer-email">{student.vi_volunteer_email}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {student.vi_date
                                                            ? new Date(student.vi_date).toLocaleDateString()
                                                            : 'N/A'}
                                                    </td>
                                                    <td>
                                                        <span className="recommendation-badge">
                                                            {student.vi_recommendation || 'YES'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="assign-btn"
                                                            onClick={() => openAssignModal(student)}
                                                        >
                                                            Assign RI Volunteer
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Assigned Students */}
                        <div className="section-card">
                            <h3 className="section-title">
                                Already Assigned Students ({assignedStudents.length})
                            </h3>
                            {assignedStudents.length === 0 ? (
                                <div className="no-data">No students assigned yet</div>
                            ) : (
                                <div className="table-container">
                                    <table className="students-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>Student ID</th>
                                                <th>Name</th>
                                                <th>District</th>
                                                <th>Assigned RI Volunteer</th>
                                                <th>Assigned Date</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assignedStudents.map((student, index) => (
                                                <tr key={student.studentId}>
                                                    <td>{index + 1}</td>
                                                    <td className="student-id">{student.studentId}</td>
                                                    <td>{student.name}</td>
                                                    <td>{student.district}</td>
                                                    <td>
                                                        <div className="volunteer-info">
                                                            <div className="volunteer-name">{student.assigned_ri_volunteer_name}</div>
                                                            <div className="volunteer-email">{student.assigned_ri_volunteer_email}</div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {student.ri_assigned_date
                                                            ? new Date(student.ri_assigned_date).toLocaleDateString()
                                                            : 'N/A'}
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${student.ri_status?.toLowerCase()}`}>
                                                            {student.ri_status || 'PENDING'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="reassign-btn"
                                                            onClick={() => openAssignModal(student)}
                                                        >
                                                            Reassign
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Assignment Modal */}
            {selectedStudent && (
                <div className="modal-overlay" onClick={closeAssignModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Assign RI Volunteer to {selectedStudent.name}</h3>
                            <button className="close-btn" onClick={closeAssignModal}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="student-info">
                                <p><strong>Student ID:</strong> {selectedStudent.studentId}</p>
                                <p><strong>District:</strong> {selectedStudent.district}</p>
                                <p><strong>VI Recommendation:</strong> {selectedStudent.vi_recommendation || 'YES'}</p>
                            </div>

                            <div className="form-section">
                                <label>Select Real Interview Volunteer</label>
                                <select
                                    value={selectedVolunteer}
                                    onChange={(e) => setSelectedVolunteer(e.target.value)}
                                    className="volunteer-select"
                                >
                                    <option value="">-- Select RI Volunteer --</option>
                                    {volunteers.map(volunteer => (
                                        <option key={volunteer.volunteerId} value={volunteer.volunteerId}>
                                            {volunteer.name} ({volunteer.email})
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="assign-submit-btn"
                                    onClick={handleAssign}
                                    disabled={assigning || !selectedVolunteer}
                                >
                                    {assigning ? 'Assigning...' : 'Assign Volunteer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperadminAssignRealInterviewPage;
