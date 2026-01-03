import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import tvService from '../../services/tvService';
import authService from '../../services/authService';
import './TVStudentsPage.css';
import logo from '../../assets/logo_icon.jpg';

const TVStudentsPage = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'tv') {
            navigate('/login');
            return;
        }
        loadStudents();
        // Refresh every 10 seconds for TV
        const interval = setInterval(loadStudents, 10000);
        return () => clearInterval(interval);
    }, [navigate]);

    const loadStudents = async () => {
        const result = await tvService.getAssignedStudents();
        if (result.success) {
            setStudents(result.students);
            setError('');
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="students-assign-page">
            <header className="header-with-logout">
                <button onClick={handleLogout} className="logout-btn-right">
                    Logout
                </button>
                <div className="header-center-content">
                    <img src={logo} alt="Logo" className="header-logo-center" />
                </div>
            </header>

            <div className="page-title">Assigned Students (Televerification)</div>

            <div className="table-wrapper">
                {loading ? (
                    <div className="empty">Loading...</div>
                ) : error ? (
                    <div className="empty error">Error: {error}</div>
                ) : students.length === 0 ? (
                    <div className="empty">No students assigned for televerification.</div>
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
                                            to={`/tv/student/${student.studentId}`}
                                            className="student-id-link"
                                        >
                                            {student.studentId}
                                        </Link>
                                    </td>
                                    <td>{student.name || ''}</td>
                                    <td>{student.phone || ''}</td>
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

export default TVStudentsPage;
