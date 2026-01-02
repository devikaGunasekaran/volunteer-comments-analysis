import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './AdminAssignPVPage.css';

const AdminAssignPVPage = () => {
    const [students, setStudents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [selectedVolunteer, setSelectedVolunteer] = useState('');
    const [searchEmail, setSearchEmail] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [studentsData, volunteersData] = await Promise.all([
                adminService.getTVSelectedStudents(),
                adminService.getVolunteers()
            ]);

            if (studentsData.students) {
                setStudents(studentsData.students);
            }
            if (volunteersData.volunteers) {
                setVolunteers(volunteersData.volunteers);
            }
        } catch (error) {
            console.error("Failed to load data:", error);
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

    const openAssignModal = (student) => {
        setSelectedStudent(student);
        setSelectedVolunteer('');
        setSearchEmail('');
        setMessage({ type: '', text: '' });
    };

    const closeAssignModal = () => {
        setSelectedStudent(null);
        setSelectedVolunteer('');
        setSearchEmail('');
        setMessage({ type: '', text: '' });
    };

    const handleAssign = async () => {
        if (!selectedStudent || !selectedVolunteer) {
            setMessage({ type: 'error', text: 'Please select a volunteer' });
            return;
        }

        setAssigning(true);
        setMessage({ type: '', text: '' });

        try {
            const result = await adminService.assignPVVolunteer(
                selectedStudent.studentId,
                selectedVolunteer,
                null
            );

            if (result.success) {
                setMessage({ type: 'success', text: result.message || 'Volunteer assigned successfully!' });
                setTimeout(() => {
                    closeAssignModal();
                    loadData(); // Reload data to show updated assignments
                }, 1500);
            }
        } catch (error) {
            console.error("Assignment failed:", error);
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Failed to assign volunteer'
            });
        } finally {
            setAssigning(false);
        }
    };

    const handleSearchByEmail = async () => {
        if (!searchEmail.trim()) {
            setMessage({ type: 'error', text: 'Please enter an email address' });
            return;
        }

        setAssigning(true);
        setMessage({ type: '', text: '' });

        try {
            const result = await adminService.assignPVVolunteer(
                selectedStudent.studentId,
                null,
                searchEmail
            );

            if (result.success) {
                setMessage({ type: 'success', text: result.message || 'Volunteer assigned successfully!' });
                setTimeout(() => {
                    closeAssignModal();
                    loadData();
                }, 1500);
            }
        } catch (error) {
            console.error("Assignment failed:", error);
            setMessage({
                type: 'error',
                text: error.response?.data?.error || 'Volunteer not found or assignment failed'
            });
        } finally {
            setAssigning(false);
        }
    };

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

                            {/* Method 1: Search by Email */}
                            <div className="form-section">
                                <label>Search Volunteer by Email</label>
                                <div className="search-group">
                                    <input
                                        type="email"
                                        placeholder="Enter volunteer email"
                                        value={searchEmail}
                                        onChange={(e) => setSearchEmail(e.target.value)}
                                        className="email-input"
                                    />
                                    <button
                                        className="search-assign-btn"
                                        onClick={handleSearchByEmail}
                                        disabled={assigning}
                                    >
                                        {assigning ? 'Assigning...' : 'Assign by Email'}
                                    </button>
                                </div>
                            </div>

                            <div className="divider">OR</div>

                            {/* Method 2: Select from List */}
                            <div className="form-section">
                                <label>Select from Volunteer List</label>
                                <select
                                    value={selectedVolunteer}
                                    onChange={(e) => setSelectedVolunteer(e.target.value)}
                                    className="volunteer-select"
                                >
                                    <option value="">-- Select Volunteer --</option>
                                    {filteredVolunteers.map(volunteer => (
                                        <option key={volunteer.volunteerId} value={volunteer.volunteerId}>
                                            {volunteer.email} ({volunteer.volunteerId})
                                        </option>
                                    ))}
                                </select>
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
