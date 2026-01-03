import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import superadminService from '../../services/superadminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './SuperadminAssignVIPage.css';

const SuperadminAssignVIPage = () => {
    const [students, setStudents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigningStudentId, setAssigningStudentId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all'); // all, assigned, unassigned
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Don't set global loading on refresh to avoid flicker if desired, but here we keep it for clarity
            if (!assigningStudentId) setLoading(true);

            const [studentsData, volunteersData] = await Promise.all([
                superadminService.getApprovedStudents(),
                superadminService.getVIVolunteers()
            ]);

            setVolunteers(volunteersData.volunteers || []);

            // Filter out students who have COMPLETED the process (completed, recommended, not_recommended)
            // We want to show:
            // 1. Unassigned (vi_status is null)
            // 2. Pending/Assigned (vi_status is 'PENDING' or 'ASSIGNED') - so they can be reassigned if needed
            const allStudents = studentsData.students || [];
            const activeStudents = allStudents.filter(s => {
                const status = s.vi_status || '';
                return !['COMPLETED', 'RECOMMENDED', 'NOT_RECOMMENDED'].includes(status);
            });

            setStudents(activeStudents);
        } catch (error) {
            console.error('Error loading data:', error);
            setMessage({ type: 'error', text: 'Failed to load data. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleAssignVolunteer = async (studentId, volunteerId) => {
        if (!volunteerId) {
            setMessage({ type: 'error', text: 'Please select a volunteer' });
            return;
        }

        try {
            setAssigningStudentId(studentId);
            setMessage({ type: '', text: '' });

            await superadminService.assignVIVolunteer(studentId, volunteerId);

            setMessage({ type: 'success', text: 'VI Volunteer assigned successfully!' });

            // Refresh data silently
            const studentsData = await superadminService.getApprovedStudents();
            setStudents(studentsData.students || []);

            // Clear success message after delay
            setTimeout(() => {
                setMessage({ type: '', text: '' });
            }, 3000);

        } catch (error) {
            console.error('Error assigning volunteer:', error);
            setMessage({ type: 'error', text: 'Failed to assign volunteer. Please try again.' });
        } finally {
            setAssigningStudentId(null);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getFilteredStudents = () => {
        switch (filterStatus) {
            case 'assigned':
                return students.filter(s => s.assigned_volunteer_id);
            case 'unassigned':
                return students.filter(s => !s.assigned_volunteer_id);
            default:
                return students;
        }
    };

    const filteredStudents = getFilteredStudents();

    return (
        <div className="superadmin-assign-vi-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Assign VI Volunteers</div>
            </header>

            <div className="container">
                <div className="page-header">
                    <h2>Assign Virtual Interview Volunteers</h2>
                    <button
                        onClick={() => navigate('/superadmin/dashboard')}
                        className="back-btn"
                    >
                        ← Back to Dashboard
                    </button>
                </div>

                {message.text && (
                    <div className={`message-toast ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {/* Filter Buttons */}
                <div className="filter-container">
                    <button
                        className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('all')}
                    >
                        All Students ({students.length})
                    </button>
                    <button
                        className={`filter-btn ${filterStatus === 'unassigned' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('unassigned')}
                    >
                        Unassigned ({students.filter(s => !s.assigned_volunteer_id).length})
                    </button>
                    <button
                        className={`filter-btn ${filterStatus === 'assigned' ? 'active' : ''}`}
                        onClick={() => setFilterStatus('assigned')}
                    >
                        Assigned ({students.filter(s => s.assigned_volunteer_id).length})
                    </button>
                </div>

                {/* Students Table */}
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner">Loading...</div>
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
                                    <th>Phone</th>
                                    <th>Current Assignment</th>
                                    <th>Assign VI Volunteer</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStudents.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="no-data">
                                            No students found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStudents.map((student, index) => (
                                        <tr key={student.studentId}>
                                            <td>{index + 1}</td>
                                            <td className="student-id">{student.studentId}</td>
                                            <td>{student.name}</td>
                                            <td>{student.district}</td>
                                            <td>{student.phone}</td>
                                            <td>
                                                {student.assigned_volunteer_id ? (
                                                    <div className="assignment-info">
                                                        <div className="volunteer-name">
                                                            {student.volunteer_name || student.assigned_volunteer_id}
                                                        </div>
                                                        <div className="volunteer-email">
                                                            {student.volunteer_email}
                                                        </div>
                                                        <div className="assignment-date">
                                                            Assigned: {new Date(student.assignedDate).toLocaleDateString()}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="unassigned-badge">Not Assigned</span>
                                                )}
                                            </td>
                                            <td>
                                                <select
                                                    className="volunteer-select"
                                                    defaultValue={student.assigned_volunteer_id || ''}
                                                    disabled={assigningStudentId === student.studentId}
                                                    id={`volunteer-select-${student.studentId}`}
                                                >
                                                    <option value="">Select Volunteer</option>
                                                    {volunteers.map(volunteer => (
                                                        <option
                                                            key={volunteer.volunteerId}
                                                            value={volunteer.volunteerId}
                                                        >
                                                            {volunteer.name} ({volunteer.volunteerId})
                                                        </option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <button
                                                    className="assign-btn"
                                                    onClick={() => {
                                                        const selectElement = document.getElementById(`volunteer-select-${student.studentId}`);
                                                        handleAssignVolunteer(student.studentId, selectElement.value);
                                                    }}
                                                    disabled={assigningStudentId === student.studentId}
                                                >
                                                    {assigningStudentId === student.studentId ? (
                                                        'Assigning...'
                                                    ) : student.assigned_volunteer_id ? (
                                                        'Reassign'
                                                    ) : (
                                                        'Assign'
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SuperadminAssignVIPage;
