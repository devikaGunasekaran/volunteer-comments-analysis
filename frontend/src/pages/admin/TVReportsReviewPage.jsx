import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Users, Video, FileText, CheckCircle } from 'lucide-react';
import adminService from '../../services/adminService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './TVReportsReviewPage.css';

const TVReportsReviewPage = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // studentId of item being processed
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || (user.role !== 'admin' && user.role !== 'tv_admin')) {
            navigate('/login');
            return;
        }
        fetchReports();
    }, [navigate]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const result = await adminService.getTVReports();
            setReports(result.reports || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
            alert('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="admin-layout animate-fadeIn">
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
                        className="nav-item"
                        onClick={() => navigate('/admin/tv-assignment')}
                    >
                        <span className="icon"><Users size={18} /></span> Assign Students
                    </button>
                    <button
                        className="nav-item active"
                        onClick={() => { }}
                    >
                        <span className="icon"><FileText size={18} /></span> Pending Approvals
                    </button>
                    <button
                        className="nav-item"
                        onClick={() => navigate('/admin/tv-students')}
                    >
                        <span className="icon"><CheckCircle size={18} /></span> Completed TV
                    </button>
                </div>

                <div className="nav-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        Sign Out
                    </button>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="main-content">
                <div className="page-container">
                    <div className="page-header animate-slideUp">
                        <div className="header-text">
                            <h1 className="page-title">Pending TV Approvals</h1>
                            <p className="page-subtitle">Approve TV verifications to move students to PV</p>
                        </div>
                        <div className="header-badge">
                            <span className="badge badge-primary">
                                <FileText size={14} /> {reports.length} Pending
                            </span>
                        </div>
                    </div>

                    <div className="card animate-slideUp stagger-1">
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Student Name</th>
                                        <th>District</th>
                                        <th>Volunteer</th>
                                        <th>Submitted Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reports.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="empty-state">
                                                <div className="empty-state-icon" style={{ display: 'flex', justifyContent: 'center' }}><CheckCircle size={48} color="#10B981" /></div>
                                                <div className="empty-state-title">All Caught Up!</div>
                                                <div className="empty-state-description">
                                                    No submitted TV reports pending review at the moment
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        reports.map(report => (
                                            <tr key={report.studentId} className="hover-lift-sm">
                                                <td>
                                                    <Link to={`/admin/tv-report/${report.studentId}`} className="student-id-link">
                                                        {report.studentId}
                                                    </Link>
                                                </td>
                                                <td className="font-semibold">{report.name}</td>
                                                <td>{report.district}</td>
                                                <td className="text-tertiary">{report.volunteerName}</td>
                                                <td>{new Date(report.verificationDate).toLocaleDateString()}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TVReportsReviewPage;
