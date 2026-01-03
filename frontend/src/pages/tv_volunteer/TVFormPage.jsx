import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import tvService from '../../services/tvService';
import './TVFormPage.css';
import logo from '../../assets/logo_icon.jpg';

const TVFormPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        status: 'VERIFIED',
        comments: '',
        suggestion: '',
    });

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'tv') {
            navigate('/login');
            return;
        }
    }, [navigate]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.comments || !formData.suggestion) {
            alert('Please fill all required fields (Comments and Suggestion)');
            return;
        }

        setIsSubmitting(true);

        try {
            const user = JSON.parse(localStorage.getItem('user'));

            // For now, we combine suggestions into comments or handle as requested
            // The user asked for "volunteer has to give his suggestion the tv_volunteer page as given in pv_form page"
            const fullComments = `
Comments: ${formData.comments}

Volunteer Suggestion: ${formData.suggestion}
            `.trim();

            const payload = {
                studentId,
                volunteerId: user.volunteerId,
                status: formData.status,
                comments: fullComments
            };

            const result = await tvService.submitVerification(payload);

            if (result.success) {
                alert('Televerification Submitted Successfully!');
                navigate('/tv/students');
            } else {
                alert('Error submitting TV: ' + result.error);
            }

        } catch (error) {
            console.error(error);
            alert(error.message || 'System error during submission');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="pv-form-page"> {/* Reusing the root class for styling */}
            <header className="header-vertical">
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Televerification Form</div>
            </header>

            <div className="pv-container">
                <div className="student-info-banner">
                    Student ID: {studentId}
                </div>

                <div className="form-section">
                    <label className="form-label">Verification Status <span className="required">*</span></label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                    >
                        <option value="VERIFIED">Verified (Details Correct)</option>
                        <option value="REJECTED">Rejected (Fake/Incorrect)</option>
                        <option value="PENDING">Pending (Call Later)</option>
                    </select>
                </div>

                <div className="form-section">
                    <label className="form-label">Call Comments <span className="required">*</span></label>
                    <textarea
                        name="comments"
                        value={formData.comments}
                        onChange={handleInputChange}
                        placeholder="Enter details from the call (e.g., student confirmed phone, address, etc.)"
                        required
                    />
                </div>

                <div className="form-section">
                    <label className="form-label">Volunteer Suggestion <span className="required">*</span></label>
                    <select
                        name="suggestion"
                        value={formData.suggestion}
                        onChange={handleInputChange}
                        required
                    >
                        <option value="">-- Select Recommendation --</option>
                        <option value="Select">Select</option>
                        <option value="Reject">Reject</option>
                        <option value="On Hold">On Hold</option>
                    </select>
                </div>

                <button
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Submitting TV...' : 'Submit TV Report'}
                </button>

            </div>
        </div>
    );
};

export default TVFormPage;
