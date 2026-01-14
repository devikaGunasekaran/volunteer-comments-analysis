import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Video, Target, GraduationCap, BarChart2, ArrowLeft } from 'lucide-react';
import superadminService from '../../services/superadminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './SuperadminAssignVIPage.css';

const SuperadminAssignVIPage = () => {
    const [students, setStudents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [assigningStudentId, setAssigningStudentId] = useState(null);
    const [completedStudents, setCompletedStudents] = useState([]);
    const [filterStatus, setFilterStatus] = useState('unassigned'); // Default to unassigned for better workflow
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // Don't set global loading on refresh to avoid flicker if desired, but here we keep it for clarity
            if (!assigningStudentId) setLoading(true);

            const [studentsData, volunteersData, completedData] = await Promise.all([
                superadminService.getApprovedStudents(),
                superadminService.getVIVolunteers(),
                superadminService.getCompletedVI()
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

            // Completed students normalization
            const completed = (completedData.interviews || []).map(s => ({
                ...s,
                name: s.student_name, // Map student_name to name
                assigned_volunteer_id: 'COMPLETED', // Marker
                vi_status: 'COMPLETED'
            }));
            setCompletedStudents(completed);
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
            case 'completed':
                return completedStudents;
            default:
                return [...students, ...completedStudents];
        }
    };

    const filteredStudents = getFilteredStudents();

    return (
        <div className="admin-layout">
            <nav className="side-nav">
                <div className="nav-logo">
                    <img src={logo} alt="Matram Logo" className="header-logo-center" />
                    <span>Matram Admin Panel</span>
                </div>
                <div className="nav-links">
                    <button className="nav-item" onClick={() => navigate('/superadmin/dashboard')}>
                        <span className="icon"><Home size={18} /></span> Overview
                    </button>
                    <button className="nav-item active" onClick={() => { }}>
                        <span className="icon"><Video size={18} /></span> Virtual Interview
                    </button>
                    <button className="nav-item" onClick={() => navigate('/superadmin/dashboard')}>
                        <span className="icon"><Target size={18} /></span> Real Interview
                    </button>
                    <button className="nav-item" onClick={() => navigate('/superadmin/dashboard')}>
                        <span className="icon"><GraduationCap size={18} /></span> Final Selection
                    </button>
                    <button className="nav-item" onClick={() => navigate('/superadmin/analytics')}>
                        <span className="icon"><BarChart2 size={18} /></span> Analytics
                    </button>
                </div>
                <div className="nav-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        Sign Out
                    </button>
                </div>
            </nav>

            <main className="main-content">
                <div className="superadmin-assign-vi-page">
                    <div className="page-header">
                        <h2>Assign Virtual Interview Volunteers</h2>
                        <button
                            onClick={() => navigate('/superadmin/dashboard')}
                            className="back-btn"
                        >
                            <ArrowLeft size={18} style={{ marginRight: 8 }} /> Back to Dashboard
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
                            All Students ({students.length + completedStudents.length})
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
                        <button
                            className={`filter-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('completed')}
                        >
                            Completed ({completedStudents.length})
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
                                {/* ... existing table ... */}
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>District</th>
                                        <th>Current Assignment</th>
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
                                                <td
                                                    className="student-id clickable"
                                                    onClick={() => navigate(`/superadmin/student-profile/${student.studentId}`)}
                                                    style={{ cursor: 'pointer', color: '#0066cc' }}
                                                    title="View Student Profile"
                                                >
                                                    {student.studentId}
                                                </td>
                                                <td>{student.name}</td>
                                                <td>{student.district}</td>
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
                                                    {student.vi_status === 'COMPLETED' ? (
                                                        <span style={{ color: '#666', fontSize: '13px' }}>Done</span>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                            <select
                                                                className="volunteer-select"
                                                                defaultValue={student.assigned_volunteer_id || ''}
                                                                disabled={assigningStudentId === student.studentId}
                                                                id={`volunteer-select-${student.studentId}`}
                                                                style={{ maxWidth: '200px' }}
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
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main >
        </div >
    );
};

export default SuperadminAssignVIPage;
