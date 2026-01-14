import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Home, Video, Target, GraduationCap, BarChart2, User, Phone, Star, ArrowLeft } from 'lucide-react';
import educationalService from '../../services/educationalService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './StudentProfilePage.css';

const StudentProfilePage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStudentProfile();
    }, [studentId]);

    const loadStudentProfile = async () => {
        try {
            setLoading(true);
            const data = await educationalService.getStudentProfile(studentId);
            setProfile(data.profile);
        } catch (error) {
            console.error('Error loading student profile:', error);
            alert('Failed to load student profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const AdminLayout = ({ children }) => (
        <div className="admin-layout">
            <nav className="side-nav">
                <div className="nav-logo">
                    <img src={logo} alt="Matram Logo" className="header-logo-center" />
                    <span>Matram Admin Panel</span>
                </div>
                <div className="nav-links">
                    <button className="nav-item" onClick={() => navigate('/superadmin/dashboard')}>
                        <span className="icon"><Home size={18} /></span> Overview
                    </button>
                    <button className="nav-item" onClick={() => navigate('/superadmin/vi-students')}>
                        <span className="icon"><Video size={18} /></span> Virtual Interview
                    </button>
                    <button className="nav-item" onClick={() => navigate('/superadmin/real-interview-students')}>
                        <span className="icon"><Target size={18} /></span> Real Interview
                    </button>
                    <button className="nav-item active" onClick={() => navigate('/superadmin/selected-students')}>
                        <span className="icon"><GraduationCap size={18} /></span> Final Selection
                    </button>
                    <button className="nav-item" onClick={() => navigate('/superadmin/analytics')}>
                        <span className="icon"><BarChart2 size={18} /></span> Analytics
                    </button>
                </div>
                <div className="nav-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        Sign Out
                    </button>
                </div>
            </nav>
            <main className="main-content">
                <div className="student-profile-page">
                    <div className="container">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );

    if (loading) {
        return (
            <AdminLayout>
                <div className="loading-container">
                    <div className="loading-spinner">Loading student profile...</div>
                </div>
            </AdminLayout>
        );
    }

    if (!profile) {
        return (
            <AdminLayout>
                <div className="no-data">Student not found</div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header">
                <h2>Complete Student Profile</h2>
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={18} style={{ marginRight: 6 }} /> Back
                </button>
            </div>

            {/* Student Basic Info */}
            <div className="profile-section basic-info">
                <h3><User size={20} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Student Information</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <label>Student ID:</label>
                        <span className="highlight">{profile.studentId}</span>
                    </div>
                    <div className="info-item">
                        <label>Name:</label>
                        <span className="highlight">{profile.name}</span>
                    </div>
                    <div className="info-item">
                        <label>District:</label>
                        <span>{profile.district}</span>
                    </div>
                    <div className="info-item">
                        <label>Phone:</label>
                        <span>{profile.phone || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>Email:</label>
                        <span>{profile.email || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>Status:</label>
                        <span className={`badge ${profile.student_status?.toLowerCase()}`}>
                            {profile.student_status || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Telephonic Verification (TV) */}
            <div className="profile-section tv-section">
                <h3><Phone size={20} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Telephonic Verification (TV)</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <label>TV Volunteer:</label>
                        <span>{profile.tv_volunteer_name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>Verification Date:</label>
                        <span>
                            {profile.tv_date ? new Date(profile.tv_date).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                    <div className="info-item">
                        <label>Status:</label>
                        <span className={`badge ${profile.tv_status?.toLowerCase()}`}>
                            {profile.tv_status || 'N/A'}
                        </span>
                    </div>
                </div>
                {profile.tv_comments && (
                    <div className="comments-box">
                        <strong>TV Comments:</strong>
                        <p>{profile.tv_comments}</p>
                    </div>
                )}
            </div>

            {/* Physical Verification (PV) */}
            <div className="profile-section pv-section">
                <h3><Home size={20} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Physical Verification (PV)</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <label>PV Volunteer:</label>
                        <span>{profile.pv_volunteer_name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>Verification Date:</label>
                        <span>
                            {profile.pv_date ? new Date(profile.pv_date).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                    <div className="info-item">
                        <label>PV Recommendation:</label>
                        <span className={`badge ${profile.pv_recommendation?.toLowerCase()}`}>
                            {profile.pv_recommendation || 'N/A'}
                        </span>
                    </div>
                    <div className="info-item">
                        <label>AI Sentiment Score:</label>
                        <span className="score">{profile.pv_sentiment_score || 'N/A'}%</span>
                    </div>
                </div>
                {profile.pv_comments && (
                    <div className="comments-box">
                        <strong>PV Comments:</strong>
                        <p>{profile.pv_comments}</p>
                    </div>
                )}
                {profile.pv_elements && (
                    <div className="comments-box">
                        <strong>AI Analysis:</strong>
                        <p>{profile.pv_elements}</p>
                    </div>
                )}
            </div>

            {/* Virtual Interview (VI) */}
            <div className="profile-section vi-section">
                <h3><Video size={20} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Virtual Interview (VI)</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <label>VI Volunteer:</label>
                        <span>{profile.vi_volunteer_name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>Interview Date:</label>
                        <span>
                            {profile.vi_date ? new Date(profile.vi_date).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                    <div className="info-item">
                        <label>VI Recommendation:</label>
                        <span className={`badge ${profile.vi_recommendation?.toLowerCase()}`}>
                            {profile.vi_recommendation || 'N/A'}
                        </span>
                    </div>
                </div>
                {profile.vi_comments && (
                    <div className="comments-box">
                        <strong>VI Comments:</strong>
                        <p>{profile.vi_comments}</p>
                    </div>
                )}
            </div>

            {/* Real Interview (RI) */}
            <div className="profile-section ri-section">
                <h3><Target size={20} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Real Interview (RI)</h3>
                <div className="info-grid">
                    <div className="info-item">
                        <label>RI Volunteer:</label>
                        <span>{profile.ri_volunteer_name || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <label>Assigned Date:</label>
                        <span>
                            {profile.ri_assigned_date ? new Date(profile.ri_assigned_date).toLocaleDateString() : 'N/A'}
                        </span>
                    </div>
                    <div className="info-item">
                        <label>RI Recommendation:</label>
                        <span className={`badge ${profile.ri_recommendation?.toLowerCase()}`}>
                            {profile.ri_recommendation || 'Pending'}
                        </span>
                    </div>
                </div>
                {profile.ri_remarks && (
                    <div className="comments-box">
                        <strong>RI Remarks:</strong>
                        <p>{profile.ri_remarks}</p>
                    </div>
                )}
            </div>

            {/* Final Scholarship Decision (Before Edu) */}
            {profile.finalDecision && (
                <div className="profile-section final-section">
                    <h3><Star size={20} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Final Scholarship Decision</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>Decision:</label>
                            <span className={`badge ${profile.finalDecision?.toLowerCase()}`}>
                                {profile.finalDecision}
                            </span>
                        </div>
                        <div className="info-item">
                            <label>Decision Date:</label>
                            <span>
                                {profile.finalDecisionDate ? new Date(profile.finalDecisionDate).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                    </div>
                    {profile.finalRemarks && (
                        <div className="comments-box">
                            <strong>Final Remarks:</strong>
                            <p>{profile.finalRemarks}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Educational Details (Last) */}
            {profile.collegeName && (
                <div className="profile-section edu-section">
                    <h3><GraduationCap size={20} style={{ verticalAlign: 'middle', marginRight: 10 }} /> Educational Details</h3>
                    <div className="info-grid">
                        <div className="info-item">
                            <label>College Name:</label>
                            <span>{profile.collegeName}</span>
                        </div>
                        <div className="info-item">
                            <label>Degree:</label>
                            <span>{profile.degree}</span>
                        </div>
                        <div className="info-item">
                            <label>Stream:</label>
                            <span>{profile.stream}</span>
                        </div>
                        <div className="info-item">
                            <label>Branch/Specialization:</label>
                            <span className="highlight">{profile.branch || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <label>Year of Passing:</label>
                            <span>{profile.yearOfPassing}</span>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default StudentProfilePage;
