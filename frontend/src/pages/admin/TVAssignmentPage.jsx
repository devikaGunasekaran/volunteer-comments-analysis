import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Users, Video, FileText } from 'lucide-react';
import adminService from '../../services/adminService';
import logo from '../../assets/logo_icon.jpg';
import './TVAssignmentPage.css';

const TVAssignmentPage = () => {
    const [students, setStudents] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [selectedVolunteer, setSelectedVolunteer] = useState('');
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || (user.role !== 'admin' && user.role !== 'tv_admin')) {
            navigate('/login');
            return;
        }
        fetchData();
    }, [navigate]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [studentRes, volunteerRes] = await Promise.all([
                adminService.getUnassignedTVStudents(),
                adminService.getTVVolunteers()
            ]);
            setStudents(studentRes.students || []);
            setVolunteers(volunteerRes.volunteers || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const toggleStudentSelection = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        (student.district && student.district.toLowerCase().includes(studentSearchTerm.toLowerCase()))
    );

    const handleAssign = async () => {
        if (selectedStudents.length === 0 || !selectedVolunteer) {
            alert('Please select at least one student and a volunteer');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await adminService.assignTV(selectedStudents, selectedVolunteer);
            if (result.success) {
                alert('Students assigned successfully!');
                setSelectedStudents([]);
                setSelectedVolunteer('');
                fetchData(); // Refresh list
            } else {
                alert('Assignment failed: ' + result.error);
            }
        } catch (error) {
            console.error('Assignment error:', error);
            alert('Error during assignment');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="admin-layout">
            {/* Sidebar Navigation */}
            <nav className="side-nav">
                <div className="nav-logo">
                    <img src={logo} alt="Matram Logo" className="header-logo-center" />
                    <span>TV Admin Panel</span>
                </div>

                <div className="nav-links">
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/tv-dashboard')}
                    >
                        <span className="icon"><Home size={18} /></span> Overview
                    </button>
                    <button
                        className="nav-item active"
                        onClick={() => { }}
                    >
                        <span className="icon"><Users size={18} /></span> Assign Students
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/tv-reports')}
                    >
                        <span className="icon"><FileText size={18} /></span> Reports Review
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/tv-students')}
                    >
                        <span className="icon"><Video size={18} /></span> Completed TV
                    </button>
                </div>

                <div className="nav-footer">
                    <button onClick={() => navigate('/login')} className="logout-btn">
                        Sign Out
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="main-content">
                <div className="admin-assign-page">
                    <div className="section-header-row">
                        <h3>TV Assignment</h3>
                        <p className="section-subtitle">Assign students to Televerification Volunteers</p>
                    </div>

                    <div className="assigned-container" style={{ margin: 0, maxWidth: '100%', padding: 0 }}>
                        <div className="search-controls-container">
                            <input
                                type="text"
                                placeholder="Search Student (Name, ID, District)..."
                                value={studentSearchTerm}
                                onChange={(e) => setStudentSearchTerm(e.target.value)}
                                className="student-search-input-large"
                            />
                        </div>
                        <div className="assignment-controls">
                            <div className="control-group searchable-select-container" ref={dropdownRef}>
                                <label>Assign Selected to:</label>
                                <div className="searchable-select">
                                    <input
                                        type="text"
                                        placeholder="Search Volunteer (Name/Email)..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setShowDropdown(true);
                                        }}
                                        onFocus={() => setShowDropdown(true)}
                                        className="search-input"
                                    />
                                    {showDropdown && (
                                        <div className="dropdown-list">
                                            {volunteers
                                                .filter(v =>
                                                    (v.volunteerId && v.volunteerId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                                    (v.name && v.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                                    (v.email && v.email.toLowerCase().includes(searchTerm.toLowerCase()))
                                                )
                                                .map(v => (
                                                    <div
                                                        key={v.volunteerId}
                                                        className={`dropdown-item ${selectedVolunteer === v.volunteerId ? 'selected' : ''}`}
                                                        onClick={() => {
                                                            setSelectedVolunteer(v.volunteerId);
                                                            setSearchTerm(`${v.name} (${v.email || v.volunteerId})`);
                                                            setShowDropdown(false);
                                                        }}
                                                    >
                                                        {v.name} ({v.email || v.volunteerId})
                                                    </div>
                                                ))
                                            }
                                            {volunteers.filter(v =>
                                                (v.volunteerId && v.volunteerId.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                                (v.name && v.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                                (v.email && v.email.toLowerCase().includes(searchTerm.toLowerCase()))
                                            ).length === 0 && (
                                                    <div className="no-results">No volunteers found</div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                className="assign-btn"
                                onClick={handleAssign}
                                disabled={isSubmitting || selectedStudents.length === 0 || !selectedVolunteer}
                            >
                                {isSubmitting ? 'Assigning...' : `Assign ${selectedStudents.length} Students`}
                            </button>
                        </div>

                        <div className="table-wrapper">
                            <h2 className="page-title">Unassigned TV Students</h2>
                            {filteredStudents.length === 0 ? (
                                <p className="no-data">No unassigned students found in TV status matching your search.</p>
                            ) : (
                                <table className="custom-table">
                                    <thead>
                                        <tr>
                                            <th>Select</th>
                                            <th>ID</th>
                                            <th>Name</th>
                                            <th>Stage</th>
                                            <th>District</th>
                                            <th>Phone</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map(s => (
                                            <tr
                                                key={s.studentId}
                                                className={selectedStudents.includes(s.studentId) ? 'selected' : ''}
                                                onClick={() => toggleStudentSelection(s.studentId)}
                                            >
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedStudents.includes(s.studentId)}
                                                        onChange={() => { }} // Handled by tr onClick
                                                    />
                                                </td>
                                                <td>{s.studentId}</td>
                                                <td>{s.name}</td>
                                                <td>
                                                    <span className={`stage-badge ${s.status === 'TV' ? 'tv' : 'new'}`}>
                                                        {s.status === 'TV' ? 'TV Pending' : 'New Application'}
                                                    </span>
                                                </td>
                                                <td>{s.district}</td>
                                                <td>{s.phone}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TVAssignmentPage;
