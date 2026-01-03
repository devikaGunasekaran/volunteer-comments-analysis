import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import educationalService from '../../services/educationalService';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './EducationalDetailsFormPage.css';

const EducationalDetailsFormPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const student = location.state?.student;

    const [formData, setFormData] = useState({
        collegeName: '',
        degree: '',
        stream: '',
        branch: '',
        yearOfPassing: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!student) {
            alert('No student data found. Redirecting...');
            navigate('/superadmin/final-selection');
            return;
        }

        // Check if details already exist
        loadExistingDetails();
    }, [student, navigate]);

    const loadExistingDetails = async () => {
        try {
            const data = await educationalService.getDetails(student.studentId);
            if (data.details) {
                setFormData({
                    collegeName: data.details.collegeName || '',
                    degree: data.details.degree || '',
                    stream: data.details.stream || '',
                    branch: data.details.branch || '',
                    yearOfPassing: data.details.yearOfPassing || ''
                });
            }
        } catch (error) {
            console.error('Error loading existing details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.collegeName.trim() || !formData.degree.trim() ||
            !formData.stream.trim() || !formData.branch.trim() || !formData.yearOfPassing) {
            alert('Please fill in all required fields');
            return;
        }

        const year = parseInt(formData.yearOfPassing);
        if (isNaN(year) || year < 1950 || year > 2050) {
            alert('Please enter a valid year of passing');
            return;
        }

        setSubmitting(true);
        try {
            const result = await educationalService.saveDetails(
                student.studentId,
                formData.collegeName,
                formData.degree,
                formData.stream,
                formData.branch,
                year
            );

            if (result.success) {
                alert(result.message || 'Educational details saved successfully!');
                navigate('/superadmin/final-selection');
            }
        } catch (error) {
            console.error('Error saving educational details:', error);
            alert('Failed to save educational details. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!student) {
        return null;
    }

    return (
        <div className="educational-details-page">
            <header className="header-vertical">
                <button onClick={handleLogout} className="logout-btn-right">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Educational Details Form</div>
            </header>

            <div className="container">
                <div className="form-card">
                    <div className="student-info-banner">
                        <h2>🎓 Student Educational Information</h2>
                        <div className="student-basic-info">
                            <div className="info-item">
                                <label>Student ID:</label>
                                <span>{student.studentId}</span>
                            </div>
                            <div className="info-item">
                                <label>Name:</label>
                                <span>{student.name}</span>
                            </div>
                            <div className="info-item">
                                <label>District:</label>
                                <span>{student.district}</span>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="loading-container">
                            <div className="loading-spinner">Loading...</div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="educational-form">
                            <div className="form-group">
                                <label className="required">College Name</label>
                                <input
                                    type="text"
                                    name="collegeName"
                                    value={formData.collegeName}
                                    onChange={handleChange}
                                    placeholder="Enter college name"
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="required">Degree</label>
                                    <select
                                        name="degree"
                                        value={formData.degree}
                                        onChange={handleChange}
                                        className="form-input"
                                        required
                                    >
                                        <option value="">Select Degree</option>
                                        <option value="B.Tech">B.Tech</option>
                                        <option value="B.E">B.E</option>
                                        <option value="B.Sc">B.Sc</option>
                                        <option value="B.A">B.A</option>
                                        <option value="B.Com">B.Com</option>
                                        <option value="BBA">BBA</option>
                                        <option value="BCA">BCA</option>
                                        <option value="M.Tech">M.Tech</option>
                                        <option value="M.Sc">M.Sc</option>
                                        <option value="M.A">M.A</option>
                                        <option value="MBA">MBA</option>
                                        <option value="MCA">MCA</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="required">Stream</label>
                                    <select
                                        name="stream"
                                        value={formData.stream}
                                        onChange={handleChange}
                                        className="form-input"
                                        required
                                    >
                                        <option value="">Select Stream</option>
                                        <option value="Engineering">Engineering</option>
                                        <option value="Arts">Arts</option>
                                        <option value="Science">Science</option>
                                        <option value="Commerce">Commerce</option>
                                        <option value="Management">Management</option>
                                        <option value="Computer Applications">Computer Applications</option>
                                        <option value="Medicine">Medicine</option>
                                        <option value="Law">Law</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="required">Branch / Specialization</label>
                                <input
                                    type="text"
                                    name="branch"
                                    value={formData.branch}
                                    onChange={handleChange}
                                    placeholder="e.g., Civil, Mechanical, AIDS, Computer Science"
                                    className="form-input"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="required">Year of Passing</label>
                                <input
                                    type="number"
                                    name="yearOfPassing"
                                    value={formData.yearOfPassing}
                                    onChange={handleChange}
                                    placeholder="Enter year (e.g., 2024)"
                                    className="form-input"
                                    min="1950"
                                    max="2050"
                                    required
                                />
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    onClick={() => navigate('/superadmin/final-selection')}
                                    className="cancel-btn"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="submit-btn"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Saving...' : 'Save Educational Details'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EducationalDetailsFormPage;
