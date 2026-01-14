import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Users, Clock, CheckCircle, Search } from 'lucide-react';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './AdminAssignPVPage.css';

const AdminAssignPVPage = () => {
    const [students, setStudents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [statistics, setStatistics] = useState({ total_tv_selected: 0, total_assigned: 0, completed: 0, pending: 0 });
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
            if (statsData.statistics) {
                setStatistics(statsData.statistics);
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


    const filteredVolunteers = volunteers.filter(v =>
        v.email.toLowerCase().includes(searchEmail.toLowerCase())
    );

    const assignedStudents = students.filter(s => s.assigned_volunteer_id);
    const unassignedStudents = students.filter(s => !s.assigned_volunteer_id);

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
                        className="nav-item active"
                        onClick={() => { }}
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
            </nav >

            {/* Main Content Area */}
            < main className="main-content" >
                <div className="admin-assign-pv-page">
                    <div className="section-header-row">
                        <h3>Assign PV Volunteers</h3>
                        <p className="section-subtitle">Manage student-volunteer assignments</p>
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
                                        <div className={`message ${message.type} `}>
                                            {message.text}
                                        </div>
                                    )}

                                    {/* Search Input */}
                                    <div className="search-container">
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
                                                    className={`volunteer - item ${selectedVolunteer === volunteer.volunteerId ? 'selected' : ''} `}
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
            </main >
        </div >
    );
};

export default AdminAssignPVPage;
