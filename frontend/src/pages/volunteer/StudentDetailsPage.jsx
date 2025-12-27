import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import volunteerService from '../../services/volunteerService';
import authService from '../../services/authService';
import './StudentDetailsPage.css';
import logo from '../../assets/logo_icon.jpg';

const StudentDetailsPage = () => {
    const { studentId } = useParams();
    const [student, setStudent] = useState(null);
    const [marks10, setMarks10] = useState(null);
    const [marks12, setMarks12] = useState(null);
    const [latestTv, setLatestTv] = useState(null);
    const [latestPv, setLatestPv] = useState(null);
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openSections, setOpenSections] = useState({});

    useEffect(() => {
        loadStudentDetails();
        loadImages();
    }, [studentId]);

    const loadStudentDetails = async () => {
        const result = await volunteerService.getStudentDetails(studentId);
        if (result.success) {
            const { data } = result;
            setStudent(data.student || {});
            setMarks10(data.marks10 || {});
            setMarks12(data.marks12 || {});
            setLatestTv(data.latest_tv);
            setLatestPv(data.latest_pv);
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
                <div className="header-title">PV - Assigned Students</div>
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

                    {/* GO TO PV FORM BUTTON */}
                    <Link to={`/pv/${studentId}`} className="go-pv-btn">
                        Go To PV Form →
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
                            {/* 10th Marks Table */}
                            <div className="marks-table-container">
                                <h4 className="marks-title">10th Standard</h4>
                                <table className="marks-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Marks</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {['Tamil', 'English', 'Maths', 'Science', 'Social'].map((subject, index) => (
                                            <tr key={subject} style={{ animationDelay: `${index * 0.1}s` }} className="animated-row">
                                                <td>{subject}</td>
                                                <td className="font-bold">{marks10?.[subject.toLowerCase()] || '-'}</td>
                                                <td><span className="pass-badge">Pass</span></td>
                                            </tr>
                                        ))}
                                        <tr className="total-row animated-row" style={{ animationDelay: '0.6s' }}>
                                            <td><strong>Total</strong></td>
                                            <td colSpan="2"><strong>{marks10?.total || '-'} / 500</strong></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* 12th Marks Table */}
                            <div className="marks-table-container mt-4">
                                <h4 className="marks-title">12th Standard</h4>
                                <table className="marks-table">
                                    <thead>
                                        <tr>
                                            <th>Subject</th>
                                            <th>Marks</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {['Tamil', 'English', 'Maths', 'Physics', 'Chemistry'].map((subject, index) => (
                                            <tr key={subject} style={{ animationDelay: `${index * 0.1}s` }} className="animated-row">
                                                <td>{subject}</td>
                                                <td className="font-bold">{marks12?.[subject.toLowerCase()] || '-'}</td>
                                                <td><span className="pass-badge">Pass</span></td>
                                            </tr>
                                        ))}
                                        <tr className="total-row animated-row" style={{ animationDelay: '0.6s' }}>
                                            <td><strong>Total</strong></td>
                                            <td colSpan="2"><strong>{marks12?.total || '-'} / 600</strong></td>
                                        </tr>
                                        <tr className="cutoff-row animated-row" style={{ animationDelay: '0.7s' }}>
                                            <td><strong>Cutoff</strong></td>
                                            <td colSpan="2" className="cutoff-value">{marks12?.cutoff || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* TV Details */}
                    <div className="accordion-header" onClick={() => toggleSection('tv')}>
                        <div>TV Details</div>
                        <div>{openSections.tv ? '▲' : '▼'}</div>
                    </div>
                    {openSections.tv && (
                        <div className="accordion-content">
                            {latestTv ? (
                                <>
                                    <div className="status-box">
                                        TV status: <strong>{latestTv.status}</strong> on{' '}
                                        {latestTv.verificationDate || ''} by {latestTv.volunteerId || ''}
                                    </div>
                                    <div>
                                        <div className="field-label">TV Comments</div>
                                        <div className="field-value">{latestTv.comments || ''}</div>
                                    </div>
                                </>
                            ) : (
                                <div>No TV record</div>
                            )}
                        </div>
                    )}

                    {/* PV Details */}
                    <div className="accordion-header" onClick={() => toggleSection('pv')}>
                        <div>PV Details</div>
                        <div>{openSections.pv ? '▲' : '▼'}</div>
                    </div>
                    {openSections.pv && (
                        <div className="accordion-content">
                            {latestPv ? (
                                <>
                                    <div className="status-box">
                                        PV status: <strong>{latestPv.status}</strong> on{' '}
                                        {latestPv.verificationDate || ''} by {latestPv.volunteerId || ''}
                                    </div>
                                    <div>
                                        <div className="field-label">PV Comment</div>
                                        <div className="field-value">{latestPv.comment || ''}</div>
                                    </div>
                                    <div style={{ marginTop: '8px' }}>
                                        <div className="field-label">What you saw</div>
                                        <div className="field-value">{latestPv.whatYouSaw || ''}</div>
                                    </div>
                                </>
                            ) : (
                                <div>No PV record yet</div>
                            )}
                        </div>
                    )}

                    {/* House Images */}
                    <div className="accordion-header" onClick={() => toggleSection('images')}>
                        <div>House Images</div>
                        <div>{openSections.images ? '▲' : '▼'}</div>
                    </div>
                    {openSections.images && (
                        <div className="accordion-content">
                            {images.length > 0 ? (
                                <div className="gallery-grid">
                                    {images.map((url, index) => (
                                        <a href={url} target="_blank" rel="noopener noreferrer" key={index}>
                                            <img src={url} className="gallery-img" alt={`House ${index + 1}`} />
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div>No images uploaded yet.</div>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default StudentDetailsPage;
