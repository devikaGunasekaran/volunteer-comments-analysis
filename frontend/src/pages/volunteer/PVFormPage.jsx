import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import volunteerService from '../../services/volunteerService';
import './PVFormPage.css';
import logo from '../../assets/logo_icon.jpg';

const PVFormPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        propertyType: '',
        whatYouSaw: '',
        familyBackground: '',
        householdVerification: '',
        financialObservation: '',
        loanDetails: '',
        educationLoan: '',
        studentAttitude: '',
        otherObservations: '',
        backupPlan: '',
        recommendation: 'SELECT'
    });

    // Image State
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewImages, setPreviewImages] = useState([]);
    const [acceptedImages, setAcceptedImages] = useState([]);
    const [rejectedImages, setRejectedImages] = useState([]);
    const [qualityChecked, setQualityChecked] = useState(false);
    const [imagesUploaded, setImagesUploaded] = useState(false);
    const [isCheckingQuality, setIsCheckingQuality] = useState(false);
    const [isUploadingImages, setIsUploadingImages] = useState(false);

    // Audio State
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [audioBase64, setAudioBase64] = useState('');
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);

    // Submission State
    const [isSubmitting, setIsSubmitting] = useState(false);

    const MIN_IMAGES = 1;

    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            previewImages.forEach(img => URL.revokeObjectURL(img.url));
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, []);

    /* --- Form Handlers --- */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    /* --- Image Handlers --- */
    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newPreviews = files.map(file => ({
            name: file.name,
            url: URL.createObjectURL(file),
            file: file,
            status: 'pending', // pending, uploading, accepted, rejected
            reason: null
        }));

        setPreviewImages(prev => [...prev, ...newPreviews]);
        setSelectedFiles(prev => [...prev, ...files]);

        // Reset check status if new files added
        if (qualityChecked) {
            setQualityChecked(false);
            setImagesUploaded(false);
        }
    };

    const removeImage = (filename) => {
        setPreviewImages(prev => prev.filter(img => img.name !== filename));
        setSelectedFiles(prev => prev.filter(f => f.name !== filename));
        setAcceptedImages(prev => prev.filter(img => img.name !== filename));
        setRejectedImages(prev => prev.filter(img => img.name !== filename));

        if (selectedFiles.length <= 1) { // If removing makes it 0 (since state updates are async)
            setQualityChecked(false);
            setImagesUploaded(false);
        }
    };

    const handleCheckQuality = async () => {
        if (selectedFiles.length < MIN_IMAGES) {
            alert(`Please select at least ${MIN_IMAGES} images first.`);
            return;
        }

        setIsCheckingQuality(true);

        // Set all to checking state
        setPreviewImages(prev => prev.map(img => ({ ...img, status: 'uploading' })));

        const data = new FormData();
        data.append('studentId', studentId);
        selectedFiles.forEach(file => data.append('images', file));

        const result = await volunteerService.batchQualityCheck(data);

        if (result.success && result.results) {
            const newAccepted = [];
            const newRejected = [];
            const updatedPreviews = [...previewImages];

            result.results.forEach(res => {
                const imgIndex = updatedPreviews.findIndex(img => img.name === res.filename);
                if (imgIndex !== -1) {
                    if (res.status === 'GOOD') {
                        updatedPreviews[imgIndex].status = 'accepted';
                        newAccepted.push({
                            name: res.filename,
                            file: selectedFiles.find(f => f.name === res.filename)
                        });
                    } else {
                        updatedPreviews[imgIndex].status = 'rejected';
                        updatedPreviews[imgIndex].reason = res.reason;
                        newRejected.push({ name: res.filename, reason: res.reason });
                    }
                }
            });

            setPreviewImages(updatedPreviews);
            setAcceptedImages(newAccepted);
            setRejectedImages(newRejected);
            setQualityChecked(true);
        } else {
            alert('Error checking image quality: ' + (result.error || 'Unknown error'));
            setPreviewImages(prev => prev.map(img => ({ ...img, status: 'pending' }))); // Reset on error
        }

        setIsCheckingQuality(false);
    };

    /* --- Audio Handlers --- */
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioBlob(blob);
                setAudioUrl(url);

                // Convert to Base64
                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => setAudioBase64(reader.result);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error('Error accessing microphone:', err);
            alert('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleAudioUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setAudioUrl(url); // For playback

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => setAudioBase64(reader.result);
        }
    };

    /* --- Submit Handler --- */
    const handleSubmit = async () => {
        // Validation
        if (!formData.propertyType || !formData.whatYouSaw || formData.recommendation === 'SELECT') {
            alert('Please fill required fields (Property, What You Saw, Recommendation)');
            return;
        }

        if (selectedFiles.length < MIN_IMAGES) {
            alert(`⚠️ Please select at least ${MIN_IMAGES} image(s).`);
            return;
        }

        if (!qualityChecked) {
            alert("⚠️ Please click 'Check Quality' first.");
            return;
        }

        if (acceptedImages.length < MIN_IMAGES) {
            alert(`⚠️ Only ${acceptedImages.length} image(s) passed. Please add more.`);
            return;
        }

        setIsSubmitting(true);

        try {
            // Step 1: Final Upload of Accepted Images
            if (!imagesUploaded) {
                setIsUploadingImages(true);
                const uploadData = new FormData();
                uploadData.append('studentId', studentId);
                acceptedImages.forEach(img => uploadData.append('images', img.file));

                const uploadRes = await volunteerService.finalUploadBatch(uploadData);

                if (!uploadRes.success) {
                    throw new Error('Image upload failed: ' + uploadRes.error);
                }
                setImagesUploaded(true);
                setIsUploadingImages(false);
            }

            // Step 2: Submit Form Data
            const mergedComments = `
Family Background: ${formData.familyBackground}

Household Verification: ${formData.householdVerification}

Financial Observation: ${formData.financialObservation}

Loan / EMI Details: ${formData.loanDetails}

Education Loan: ${formData.educationLoan}

Student Attitude / Behavior: ${formData.studentAttitude}

Other Observations: ${formData.otherObservations}

Backup Plan: ${formData.backupPlan}`;

            const payload = {
                studentId,
                propertyType: formData.propertyType,
                whatYouSaw: formData.whatYouSaw,
                comments: mergedComments,
                recommendation: formData.recommendation,
                voiceAudio: audioBase64 || null
            };

            const result = await volunteerService.submitPV(payload);

            if (result.success) {
                alert('PV Submitted Successfully!');
                navigate('/students-assign'); // Redirect
            } else {
                alert('Error submitting PV: ' + result.error);
            }

        } catch (error) {
            console.error(error);
            alert(error.message || 'System error during submission');
        } finally {
            setIsSubmitting(false);
            setIsUploadingImages(false);
        }
    };

    return (
        <div className="pv-form-page">
            <header className="header-vertical">
                <img src={logo} alt="Logo" className="header-logo-center" />
                <div className="header-title">Physical Verification Form</div>
            </header>

            <div className="pv-container">
                <div className="student-info-banner">
                    Student ID: {studentId}
                </div>

                <div className="form-section">
                    <label className="form-label">Property Type <span className="required">*</span></label>
                    <textarea
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleInputChange}
                        placeholder="House / Rental / Orphanage / Hostel"
                    />
                </div>

                <div className="form-section">
                    <label className="form-label">What You Saw <span className="required">*</span></label>
                    <textarea
                        name="whatYouSaw"
                        value={formData.whatYouSaw}
                        onChange={handleInputChange}
                        placeholder="Describe what you observed."
                    />
                </div>

                {/* Additional Comments */}
                <div className="form-section">
                    <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#2D3748' }}>
                        🧾 PV Volunteer Additional Comments
                    </h3>

                    <div className="comments-group">
                        {[
                            { id: 'familyBackground', label: 'Family Background', placeholder: 'Jobs, income, education...' },
                            { id: 'householdVerification', label: 'Household Verification', placeholder: 'Owned/rented, roof type, appliances...' },
                            { id: 'financialObservation', label: 'Financial Observation', placeholder: 'Total income, expenses, savings...' },
                            { id: 'loanDetails', label: 'Loan / EMI Details', placeholder: 'Existing loans, EMI amount...' },
                            { id: 'educationLoan', label: 'Application for Education Loan', placeholder: 'Awareness, eligibility, applied status...' },
                            { id: 'studentAttitude', label: 'Student Attitude / Behavior', placeholder: 'Willingness to study, responsibility...' },
                            { id: 'otherObservations', label: 'Other Observations', placeholder: 'Special situations, health issues...' },
                            { id: 'backupPlan', label: 'Backup Plan', placeholder: 'If scholarship not approved...' },
                        ].map(field => (
                            <div key={field.id} className="comment-field">
                                <div className="comment-label">{field.label} <span className="required">*</span></div>
                                <textarea
                                    name={field.id}
                                    value={formData[field.id]}
                                    onChange={handleInputChange}
                                    placeholder={field.placeholder}
                                    required
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="form-section">
                    <label className="form-label">Recommendation <span className="required">*</span></label>
                    <select
                        name="recommendation"
                        value={formData.recommendation}
                        onChange={handleInputChange}
                    >
                        <option value="SELECT" disabled>-- Select Recommendation --</option>
                        <option value="ON HOLD">On Hold</option>
                        <option value="REJECT">Reject</option>
                        <option value="SELECT_FOR_SCHOLARSHIP">Select for Scholarship</option>
                    </select>
                </div>

                {/* Image Upload */}
                <div className="form-section">
                    <label className="form-label">House Images (Min {MIN_IMAGES}) <span className="required">*</span></label>
                    <div className="img-upload-container">
                        <label className="upload-trigger">
                            📷 Select Images
                            <input
                                type="file"
                                className="file-input"
                                accept="image/*"
                                multiple
                                onChange={handleFileSelect}
                            />
                        </label>

                        <div className="img-preview-grid">
                            {previewImages.map(img => (
                                <div key={img.name} className={`img-preview-card ${img.status}`}>
                                    {img.status === 'uploading' && (
                                        <div className="status-badge blue">⏳ Checking...</div>
                                    )}
                                    {img.status === 'accepted' && (
                                        <div className="status-badge green">✅ Accepted</div>
                                    )}
                                    {img.status === 'rejected' && (
                                        <div className="status-badge red">❌ Rejected</div>
                                    )}

                                    <button className="img-delete-btn" onClick={() => removeImage(img.name)}>×</button>
                                    <img src={img.url} alt="Preview" />
                                    <div className="image-name" title={img.name}>{img.name}</div>
                                    {img.reason && <div className="rejection-reason">{img.reason}</div>}
                                </div>
                            ))}
                        </div>

                        <button
                            className="check-quality-btn"
                            onClick={handleCheckQuality}
                            disabled={selectedFiles.length < MIN_IMAGES || isCheckingQuality || qualityChecked}
                        >
                            {isCheckingQuality ? 'Checking Quality...' : qualityChecked ? '✓ Quality Checked' : 'Check Quality'}
                        </button>
                    </div>
                </div>

                {/* Audio Recording */}
                <div className="form-section">
                    <label className="form-label">Record Voice Comment</label>
                    <div className="recording-controls">
                        <button
                            className="record-btn"
                            onClick={startRecording}
                            disabled={isRecording}
                        >
                            {isRecording ? 'Recording...' : '🎤 Start Recording'}
                        </button>
                        <button
                            className="stop-btn"
                            onClick={stopRecording}
                            disabled={!isRecording}
                        >
                            ⏹ Stop
                        </button>
                    </div>

                    {audioUrl && <audio src={audioUrl} controls className="audio-player" />}

                    <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '13px', color: '#718096' }}>OR</div>

                    <label className="form-label" style={{ marginTop: '12px' }}>Upload Audio File</label>
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={handleAudioUpload}
                        style={{ background: 'white' }}
                    />
                </div>

                <button
                    className="submit-btn"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (isUploadingImages ? 'Uploading Images...' : 'Submitting PV...') : 'Submit PV Report'}
                </button>

            </div>
        </div>
    );
};

export default PVFormPage;
