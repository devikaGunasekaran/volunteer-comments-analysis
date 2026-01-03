import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
        <div className="admin-assign-page">
            <header className="header-with-logout">

                <div className="header-center-content">
                    <img src={logo} alt="Logo" className="header-logo-center" />
                    <div className="header-title-center">TV Reports Review</div>
                </div>
            </header>

            <main className="assigned-container">
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
            </main>
        </div>
    );
};

export default TVReportsReviewPage;
