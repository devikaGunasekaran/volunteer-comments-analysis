import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import volunteerService from '../../services/volunteerService';
import authService from '../../services/authService';
import './StudentsAssignPage.css';
import logo from '../../assets/logo_icon.jpg';

const StudentsAssignPage = () => {
    const [students, setStudents] = useState([]);
    const [statistics, setStatistics] = useState({ total_assigned: 0, completed: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStudents();
        // Refresh every 5 seconds
        const interval = setInterval(loadStudents, 5000);
        return () => clearInterval(interval);
    }, []);

    const loadStudents = async () => {
        const result = await volunteerService.getAssignedStudents();
        if (result.success) {
            setStudents(result.students);
            setStatistics(result.statistics || { total_assigned: 0, completed: 0, pending: 0 });
            setError('');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleLogout = () => {
        authService.logout();
    };

    return (
        <div className="students-assign-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">PV - Assigned Students</div>
            </header>

            {/* Statistics Cards */}
            <div className="stats-container">
                <div className="stat-card total">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <div className="stat-value">{statistics.total_assigned}</div>
                        <div className="stat-label">Total Assigned</div>
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

            <div className="page-title">Assigned Students</div>

            <div className="table-wrapper">
                {loading ? (
                    <div className="empty">Loading...</div>
                ) : error ? (
                    <div className="empty error">Error: {error}</div>
                ) : students.length === 0 ? (
                    <div className="empty">No students assigned.</div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Student ID</th>
                                <th>Name</th>
                                <th>Phone</th>
                                <th>District</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => (
                                <tr key={student.studentId}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <Link
                                            to={`/student/${student.studentId}`}
                                            className="student-id-link"
                                        >
                                            {student.studentId}
                                        </Link>
                                    </td>
                                    <td>{student.studentName || ''}</td>
                                    <td>{student.phoneNumber || ''}</td>
                                    <td>{student.district || ''}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default StudentsAssignPage;
