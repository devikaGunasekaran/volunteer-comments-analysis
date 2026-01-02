import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import volunteerService from '../../services/volunteerService';
import authService from '../../services/authService';
import './TVStudentDetailsPage.css';
import logo from '../../assets/logo_icon.jpg';

const TVStudentDetailsPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [marks10, setMarks10] = useState(null);
    const [marks12, setMarks12] = useState(null);
    const [latestTv, setLatestTv] = useState(null);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openSections, setOpenSections] = useState({ personal: true });

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'tv') {
            navigate('/login');
            return;
        }
        loadStudentDetails();
        loadImages();
    }, [studentId, navigate]);

    const loadStudentDetails = async () => {
        const result = await volunteerService.getStudentDetails(studentId);
        if (result.success) {
            const { data } = result;
            setStudent(data.student || {});
            setMarks10(data.marks10 || {});
            setMarks12(data.marks12 || {});
            setLatestTv(data.latest_tv);
        }
        setLoading(false);
    };

    const loadImages = async () => {
        const result = await volunteerService.getStudentImages(studentId);
        if (result.success) {
            setImages(result.images);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const toggleSection = (section) => {
        setOpenSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    return (
        <div className="student-details-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">TV - Student Details</div>
            </header>

            <main className="page">
                {/* Top Card */}
                <section className="app-id-card">
                    <div>
                        <strong>Application ID:</strong> <span>{student?.studentId || '--'}</span>
                    </div>
                    <div style={{ marginTop: '8px' }}>
                        <strong>Student:</strong> <span>{student?.name || '--'}</span>
                    </div>

                    {/* GO TO TV FORM BUTTON */}
                    <Link to={`/tv/form/${studentId}`} className="go-tv-btn">
                        Go To TV Form →
                    </Link>
                    <div style={{ clear: 'both' }}></div>
                </section>

                {/* Accordions */}
                <div className="accordions">
                    {/* Personal Details */}
                    <div className="accordion-header" onClick={() => toggleSection('personal')}>
                        <div>Personal Details</div>
                        <div>{openSections.personal ? '▲' : '▼'}</div>
                    </div>
                    {openSections.personal && (
                        <div className="accordion-content">
                            <div>
                                <div className="field-label">Phone</div>
                                <div className="field-value">{student?.phone || ''}</div>
                            </div>
                            <div>
                                <div className="field-label">Email</div>
                                <div className="field-value">{student?.email || ''}</div>
                            </div>
                            <div>
                                <div className="field-label">District</div>
                                <div className="field-value">{student?.district || ''}</div>
                            </div>
                        </div>
                    )}

                    {/* Family Information */}
                    <div className="accordion-header" onClick={() => toggleSection('family')}>
                        <div>Family Information</div>
                        <div>{openSections.family ? '▲' : '▼'}</div>
                    </div>
                    {openSections.family && (
                        <div className="accordion-content">
                            <div>
                                <div className="field-label">Father</div>
                                <div className="field-value">{student?.father || ''}</div>
                            </div>
                            <div>
                                <div className="field-label">Mother</div>
                                <div className="field-value">{student?.mother || ''}</div>
                            </div>
                            <div>
                                <div className="field-label">Income</div>
                                <div className="field-value">{student?.income || ''}</div>
                            </div>
                        </div>
                    )}

                    {/* Marks */}
                    <div className="accordion-header" onClick={() => toggleSection('marks')}>
                        <div>Marks</div>
                        <div>{openSections.marks ? '▲' : '▼'}</div>
                    </div>
                    {openSections.marks && (
                        <div className="accordion-content">
                            <div className="marks-table-container">
                                <h4 className="marks-title">10th Standard</h4>
                                <table className="marks-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Marks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {['Tamil', 'English', 'Maths', 'Science', 'Social'].map((subject) => (
                                            <tr key={subject}>
                                                <td>{subject}</td>
                                                <td className="font-bold">{marks10?.[subject.toLowerCase()] || '-'}</td>
                                            </tr>
                                        ))}
                                        <tr className="total-row">
                                            <td><strong>Total</strong></td>
                                            <td><strong>{marks10?.total || '-'} / 500</strong></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="marks-table-container mt-4">
                                <h4 className="marks-title">12th Standard</h4>
                                <table className="marks-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Marks</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {['Tamil', 'English', 'Maths', 'Physics', 'Chemistry'].map((subject) => (
                                            <tr key={subject}>
                                                <td>{subject}</td>
                                                <td className="font-bold">{marks12?.[subject.toLowerCase()] || '-'}</td>
                                            </tr>
                                        ))}
                                        <tr className="total-row">
                                            <td><strong>Total</strong></td>
                                            <td><strong>{marks12?.total || '-'} / 600</strong></td>
                                        </tr>
                                        <tr className="cutoff-row">
                                            <td><strong>Cutoff</strong></td>
                                            <td className="cutoff-value">{marks12?.cutoff || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};

export default TVStudentDetailsPage;
