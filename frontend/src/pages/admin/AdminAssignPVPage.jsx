import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './AdminAssignPVPage.css';

const AdminAssignPVPage = () => {
    const [students, setStudents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
            const [studentsData, volunteersData, statsData] = await Promise.all([
                adminService.getTVSelectedStudents(),
                adminService.getVolunteers(),
                adminService.getPVStatistics()
            ]);

            if (studentsData.students) {
                setStudents(studentsData.students);
            }
            if (volunteersData.volunteers) {
                setVolunteers(volunteersData.volunteers);
            }

    const filteredVolunteers = volunteers.filter(v =>
        v.email.toLowerCase().includes(searchEmail.toLowerCase())
    );

    const assignedStudents = students.filter(s => s.assigned_volunteer_id);
    const unassignedStudents = students.filter(s => !s.assigned_volunteer_id);

    return (
        <div className="admin-assign-pv-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Admin Panel - Assign PV Volunteers</div>
            </header>

            <div className="page-title">Assign Volunteers for Physical Verification</div>
            {/* Statistics Cards */}
            <div className="stats-container">
                <div className="stat-card assigned">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <div className="stat-value">{statistics.total_assigned}</div>
                        <div className="stat-label">PV Assigned</div>
                    </div>
                </div>
                <div className="stat-card completed">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <div className="stat-value">{statistics.completed}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                </div>
                <div className="stat-card pending">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <div className="stat-value">{statistics.pending}</div>
                        <div className="stat-label">Pending</div>
                    </div>
                </div>
            </div>

            <div className="assign-container">

                {/* Unassigned Students Section */}
                <div className="section-card">
                    <h3 className="section-title">Students Awaiting Assignment ({unassignedStudents.length})</h3>
                    <div className="table-wrapper">
                        {loading ? (
                            <div className="empty-state">Loading...</div>
                        ) : unassignedStudents.length === 0 ? (
                            <div className="empty-state">All students have been assigned!</div>
                        ) : (
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>District</th>
                                        <th>Phone</th>
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
                                            <td>{student.phone || 'N/A'}</td>
                                            <td>
                                                <button
                                                    className="assign-btn"
                                                    onClick={() => openAssignModal(student)}
                                                >
                                                    Assign Volunteer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Assigned Students Section */}
                <div className="section-card">
                    <h3 className="section-title">Already Assigned Students ({assignedStudents.length})</h3>
                    <div className="table-wrapper">
                        {assignedStudents.length === 0 ? (
                            <div className="empty-state">No students assigned yet</div>
                        ) : (
                            <table className="custom-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>District</th>
                                        <th>Assigned Volunteer</th>
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
                                                <span className="volunteer-badge">
                                                    {student.volunteer_email || student.assigned_volunteer_id}
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
                        )}
                    </div>
                </div>
            </div>

            {/* Assignment Modal */}
            {selectedStudent && (
                <div className="modal-overlay" onClick={closeAssignModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Assign Volunteer to {selectedStudent.name}</h3>
                            <button className="close-btn" onClick={closeAssignModal}>×</button>
                        </div>

                        <div className="modal-body">
                            <div className="student-info">
                                <p><strong>Student ID:</strong> {selectedStudent.studentId}</p>
                                <p><strong>District:</strong> {selectedStudent.district}</p>
                            </div>

                            {message.text && (
                                <div className={`message ${message.type}`}>
                                    {message.text}
                                </div>
                            )}

                            {/* Search Input */}
                            <div className="search-container">
                                <span className="search-icon-overlay">🔍</span>
                                <input
                                    type="text"
                                    placeholder="Search volunteer by name or email..."
                                    value={searchEmail}
                                    onChange={(e) => setSearchEmail(e.target.value)}
                                    className="search-input"
                                    autoFocus
                                />
                            </div>

                            {/* Volunteer List */}
                            <div className="volunteer-list-container">
                                {filteredVolunteers.length === 0 ? (
                                    <div className="empty-state" style={{ padding: '20px', border: 'none' }}>
                                        No volunteers found matching "{searchEmail}"
                                    </div>
                                ) : (
                                    filteredVolunteers.map(volunteer => (
                                        <div
                                            key={volunteer.volunteerId}
                                            className={`volunteer-item ${selectedVolunteer === volunteer.volunteerId ? 'selected' : ''}`}
                                            onClick={() => setSelectedVolunteer(volunteer.volunteerId)}
                                        >
                                            <div className="volunteer-info">
                                                <span className="volunteer-email">{volunteer.email}</span>
                                                <span className="volunteer-id-badge">ID: {volunteer.volunteerId}</span>
                                            </div>
                                            <div className="check-icon">✓</div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="modal-footer">
                                <button
                                    className="assign-submit-btn"
                                    onClick={handleAssign}
                                    disabled={assigning || !selectedVolunteer}
                                >
                                    {assigning ? 'Assigning...' : 'Assign Selected Volunteer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAssignPVPage;
