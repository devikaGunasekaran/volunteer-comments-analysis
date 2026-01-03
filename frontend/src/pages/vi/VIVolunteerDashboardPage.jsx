import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import viVolunteerService from '../../services/viVolunteerService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './VIVolunteerDashboardPage.css';

const VIVolunteerDashboardPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        completed: 0
    });
    const navigate = useNavigate();

    useEffect(() => {
        loadAssignedStudents();
    }, []);

    const loadAssignedStudents = async () => {
        try {
            setLoading(true);
            const data = await viVolunteerService.getAssignedStudents();
            const studentsList = data.students || [];
            setStudents(studentsList);

<<<<<<< HEAD
            // Calculate stats
=======
            // Calculate stats from ALL students
>>>>>>> Tarun
            const pending = studentsList.filter(s => s.status === 'PENDING').length;
            const completed = studentsList.filter(s =>
                ['RECOMMENDED', 'NOT_RECOMMENDED', 'ON_HOLD'].includes(s.status)
            ).length;

            setStats({
                total: studentsList.length,
                pending,
                completed
            });
<<<<<<< HEAD
=======

            // Filter students state to ONLY show PENDING (active) students in the table
            // Completed students should disappear from the list
            const activeStudents = studentsList.filter(s => s.status === 'PENDING');
            setStudents(activeStudents);
>>>>>>> Tarun
        } catch (error) {
            console.error('Error loading assigned students:', error);
            alert('Failed to load assigned students. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'PENDING':
                return 'pending';
            case 'RECOMMENDED':
                return 'recommended';
            case 'NOT_RECOMMENDED':
                return 'not-recommended';
            case 'ON_HOLD':
                return 'on-hold';
            default:
                return '';
        }
    };

    return (
        <div className="vi-volunteer-dashboard-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">VI Volunteer Dashboard</div>
            </header>

            <div className="container">
                <div className="page-header">
<<<<<<< HEAD
                    <h2>Virtual Interview Dashboard</h2>
=======

>>>>>>> Tarun
                    <button
                        onClick={() => navigate('/vi/completed')}
                        className="completed-btn"
                    >
                        📋 View Completed Interviews
                    </button>
                </div>

                {/* Statistics Cards */}
                <div className="stats-container">
                    <div className="stat-card">
                        <div className="stat-icon">📚</div>
                        <div className="stat-value">{stats.total}</div>
                        <div className="stat-label">Total Assigned</div>
                    </div>
                    <div className="stat-card pending-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-value">{stats.pending}</div>
                        <div className="stat-label">Pending Interviews</div>
                    </div>
                    <div className="stat-card completed-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-value">{stats.completed}</div>
                        <div className="stat-label">Completed</div>
                    </div>
                </div>

                {/* Students Table */}
                {loading ? (
                    <div className="loading-container">
                        <div className="loading-spinner">Loading assigned students...</div>
                    </div>
                ) : (
                    <div className="table-container">
                        <h3>Assigned Students</h3>
                        {students.length === 0 ? (
                            <div className="no-data">
                                No students assigned yet
                            </div>
                        ) : (
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Student ID</th>
                                        <th>Name</th>
                                        <th>District</th>
                                        <th>Phone</th>
                                        <th>Assigned Date</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map((student, index) => (
                                        <tr key={student.viId}>
                                            <td>{index + 1}</td>
                                            <td className="student-id">{student.studentId}</td>
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
                                                <span className={`status-badge ${getStatusBadgeClass(student.status)}`}>
                                                    {student.status || 'PENDING'}
                                                </span>
                                            </td>
                                            <td>
                                                {student.status === 'PENDING' ? (
                                                    <button
                                                        className="interview-btn"
                                                        onClick={() => navigate(`/vi/interview/${student.studentId}`)}
                                                    >
                                                        Start Interview
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="view-btn"
                                                        onClick={() => navigate(`/vi/interview/${student.studentId}`)}
                                                    >
                                                        View Details
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VIVolunteerDashboardPage;
