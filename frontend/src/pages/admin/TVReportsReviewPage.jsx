import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, Users, Video, FileText } from 'lucide-react';
import adminService from '../../services/adminService';
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

    const handleDecision = async (studentId, decision) => {
        const remarks = prompt(`Enter remarks for ${decision === 'SELECT' ? 'Selection' : 'Rejection'}:`);
        if (remarks === null) return; // Cancelled

        setActionLoading(studentId);
        try {
            const result = await adminService.reviewTVSubmission(studentId, decision, remarks);
            if (result.success) {
                alert(`Student ID ${studentId} ${decision === 'SELECT' ? 'moved to PV' : 'rejected'}`);
                fetchReports(); // Refresh
            } else {
                alert('Review failed: ' + result.error);
            }
        } catch (error) {
            console.error('Decision error:', error);
            alert('Error processing decision');
        } finally {
            setActionLoading(null);
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
                        className="nav-item"
                        onClick={() => navigate('/admin/tv-assignment')}
                    >
                        <span className="icon"><Users size={18} /></span> Assign Students
                    </button>
                    <button
                        className="nav-item active"
                        onClick={() => { }}
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
                        <h3>TV Reports Review</h3>
                        <p className="section-subtitle">Review submitted Televerification reports</p>
                    </div>

                    <div className="assigned-container" style={{ margin: 0, maxWidth: '100%', padding: 0 }}>
                        <div className="table-wrapper">
                            <h2 className="page-title">Submitted TV Reports ({reports.length})</h2>
                            {reports.length === 0 ? (
                                <p className="no-data">No submitted TV reports pending review.</p>
                            ) : (
                                <table className="custom-table">
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
                                        {reports.map(report => (
                                            <tr key={report.studentId}>
                                                <td>
                                                    <Link to={`/admin/tv-report/${report.studentId}`} className="id-link">
                                                        {report.studentId}
                                                    </Link>
                                                </td>
                                                <td>{report.name}</td>
                                                <td>{report.district}</td>
                                                <td>{report.volunteerName}</td>
                                                <td>{new Date(report.verificationDate).toLocaleDateString()}</td>
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

export default TVReportsReviewPage;
