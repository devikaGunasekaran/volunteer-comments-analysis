import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import viVolunteerService from '../../services/viVolunteerService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './VIAssignedStudentsPage.css';

const VIAssignedStudentsPage = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

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

    return (
        <div className="vi-assigned-students-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">VI Panel - Assigned Students</div>
            </header>

            <div className="page-title">
                <button onClick={() => navigate('/vi/dashboard')} className="back-link">
                    ← Back to Dashboard
                </button>
                <h2>Pending Interviews</h2>
            </div>

            <div className="table-wrapper">
                {loading ? (
                    <div className="loading-state">Loading students...</div>
                ) : students.length === 0 ? (
                    <div className="empty-state">No pending students assigned using VI yet.</div>
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
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.map((student, index) => (
                                <tr key={student.studentId}>
                                    <td>{index + 1}</td>
                                    <td>
                                        <Link to={`/vi/interview/${student.studentId}`} className="clickable-id">
                                            {student.studentId}
                                        </Link>
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
                                        <button
                                            className="action-btn"
                                            onClick={() => navigate(`/vi/interview/${student.studentId}`)}
                                        >
                                            Start Interview →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default VIAssignedStudentsPage;
