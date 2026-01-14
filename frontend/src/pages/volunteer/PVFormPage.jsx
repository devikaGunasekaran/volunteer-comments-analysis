import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Home, ClipboardList, FileCheck } from 'lucide-react';
import volunteerService from '../../services/volunteerService';
import authService from '../../services/authService';
import { validateContent } from '../../utils/contentValidator';
import './PVFormPage.css';
import logo from '../../assets/logo_icon.jpg';

const PVFormPage = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();

    const handleLogout = () => {
        authService.logout();
    };

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

    // OCR State (Agent 7)
    const [showOcrModal, setShowOcrModal] = useState(false);
    const [ocrImage, setOcrImage] = useState(null);
    const [ocrImagePreview, setOcrImagePreview] = useState(null);
    const [isProcessingOcr, setIsProcessingOcr] = useState(false);
    const [ocrResult, setOcrResult] = useState(null);

    const MIN_IMAGES = 1;


    // Cleanup object URLs on unmount
    useEffect(() => {
        return () => {
            previewImages.forEach(img => {
                if (img.url && img.url.startsWith('blob:')) {
                    URL.revokeObjectURL(img.url);
                }
            });
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, []);

    // Load Draft (Saved Images)
    useEffect(() => {
        const loadDraftImages = async () => {
            if (!studentId) return;

            try {
                const result = await volunteerService.getPvImages(studentId);
                if (result.success && result.images.length > 0) {
                    // Populate preview images with saved S3 URLs
                    const savedImages = result.images.map(img => ({
                        name: `Saved Image (${new Date(img.date).toLocaleDateString()})`,
                        url: img.url,
                        file: null, // No file object for saved images
                        status: 'accepted', // Already uploaded & accepted
                        reason: '✅ Saved in Draft'
                    }));

                    setPreviewImages(savedImages);
                    setAcceptedImages(savedImages); // Treat as accepted
                    setImagesUploaded(true); // Mark as uploaded
                    setQualityChecked(true); // Mark as checked

                    console.log(`Loaded ${savedImages.length} saved images for draft`);
                }
            } catch (error) {
                console.error("Error loading draft images:", error);
            }
        };

        loadDraftImages();
    }, [studentId]);

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

            // Process results and auto-enhance blurry images
            for (const res of result.results) {
                const imgIndex = updatedPreviews.findIndex(img => img.name === res.filename);
                if (imgIndex !== -1) {
                    if (res.status === 'GOOD') {
                        updatedPreviews[imgIndex].status = 'accepted';
                        newAccepted.push({
                            name: res.filename,
                            file: selectedFiles.find(f => f.name === res.filename)
                        });
                    } else {
                        // Check if rejection reason is blur-related
                        const isBlurry = res.reason && (
                            res.reason.toLowerCase().includes('blur') ||
                            res.reason.toLowerCase().includes('focus') ||
                            res.reason.toLowerCase().includes('dark') ||
                            res.reason.toLowerCase().includes('underexposed')
                        );

                        if (isBlurry) {
                            // Auto-enhance blurry images with Agent 6
                            console.log(`🔧 Auto-enhancing blurry image: ${res.filename}`);
                            updatedPreviews[imgIndex].status = 'enhancing';
                            updatedPreviews[imgIndex].reason = 'Enhancing...';

                            // Trigger enhancement in background
                            handleAutoEnhance(res.filename, imgIndex, updatedPreviews, newAccepted, newRejected);
                        } else {
                            // Non-blur issues (black, corrupt, etc.) - cannot enhance
                            updatedPreviews[imgIndex].status = 'rejected';
                            updatedPreviews[imgIndex].reason = res.reason;
                            newRejected.push({ name: res.filename, reason: res.reason });
                        }
                    }
                }
            }

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

    // Auto-enhance handler for blurry images
    const handleAutoEnhance = async (filename, imgIndex, previews, accepted, rejected) => {
        try {
            const file = selectedFiles.find(f => f.name === filename);
            if (!file) return;

            const formData = new FormData();
            formData.append('image', file);

            const result = await volunteerService.enhanceImage(formData);

            if (result.success && result.enhanced_image) {
                // Enhancement successful!
                const enhancedFile = dataURLtoFile(result.enhanced_image, filename);

                setPreviewImages(prev => prev.map(img =>
                    img.name === filename
                        ? { ...img, url: result.enhanced_image, status: 'accepted', reason: '✅ Auto-enhanced' }
                        : img
                ));

                setAcceptedImages(prev => [...prev, { name: filename, file: enhancedFile }]);

                // Update selectedFiles with enhanced version
                setSelectedFiles(prev => prev.map(f =>
                    f.name === filename ? enhancedFile : f
                ));

                console.log(`✅ Auto-enhancement successful: ${filename}`);
            } else {
                // Enhancement failed - mark as rejected
                setPreviewImages(prev => prev.map(img =>
                    img.name === filename
                        ? { ...img, status: 'rejected', reason: result.message || 'Enhancement failed' }
                        : img
                ));

                setRejectedImages(prev => [...prev, {
                    name: filename,
                    reason: result.message || 'Enhancement failed - image quality too poor'
                }]);

                console.log(`❌ Auto-enhancement failed: ${filename}`);
            }
        } catch (error) {
            console.error('Auto-enhance error:', error);
            setPreviewImages(prev => prev.map(img =>
                img.name === filename
                    ? { ...img, status: 'rejected', reason: 'Enhancement error' }
                    : img
            ));
        }
    };

    // Helper function to convert data URL to File
    const dataURLtoFile = (dataurl, filename) => {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    // Upload Images Handler
    const handleUploadImages = async () => {
        if (acceptedImages.length < MIN_IMAGES) {
            alert(`Please ensure at least ${MIN_IMAGES} images are accepted before uploading`);
            return;
        }

        setIsUploadingImages(true);

        try {
            const formData = new FormData();
            formData.append('studentId', studentId);

            // Append all accepted images
            acceptedImages.forEach(img => {
                formData.append('images', img.file);
            });

            const result = await volunteerService.finalUploadBatch(formData);

            if (result.success) {
                setImagesUploaded(true);
                // Alert removed as per user request (UI card update is sufficient)

                // --- NEW: Refresh previews from server ---
                try {
                    const savedResult = await volunteerService.getPvImages(studentId);
                    if (savedResult.success && savedResult.images.length > 0) {
                        const savedImages = savedResult.images.map(img => ({
                            name: `Stored: ${new Date(img.date).toLocaleTimeString()}`,
                            url: img.url,
                            file: null,
                            status: 'accepted',
                            reason: '✅ Saved in Cloud'
                        }));
                        setPreviewImages(savedImages);
                        setAcceptedImages(savedImages); // Update accepted list so submit works
                    }
                } catch (fetchErr) {
                    console.error("Error fetching saved images:", fetchErr);
                }
                // -----------------------------------------

            } else {
                alert('Error uploading images: ' + (result.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Failed to upload images. Please try again.');
        } finally {
            setIsUploadingImages(false);
        }
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

    /* --- OCR Handlers (Agent 7) --- */
    const handleOcrImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setOcrImage(file);
            setOcrImagePreview(URL.createObjectURL(file));
            setOcrResult(null);
        }
    };

    const handleOcrExtract = async () => {
        if (!ocrImage) {
            alert('Please select an image first');
            return;
        }

        setIsProcessingOcr(true);
        try {
            const formData = new FormData();
            formData.append('image', ocrImage);

            const result = await volunteerService.ocrHandwriting(formData);

            if (result.success) {
                setOcrResult(result);
                alert(`✅ Text extracted successfully!\\n\\nLanguage: ${result.language}\\n${result.composition}\\n\\nClick "Auto-Fill Form" to populate fields.`);
            } else {
                alert('❌ OCR failed: ' + result.error);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setIsProcessingOcr(false);
        }
    };

    const handleOcrAutoFill = () => {
        if (!ocrResult || !ocrResult.text) {
            alert('No text to fill. Please extract text first.');
            return;
        }

        const extractedText = ocrResult.text;

        // Smart auto-fill: Try to detect which field the text belongs to
        // For now, we'll put everything in "Other Observations" 
        // You can enhance this with keyword detection later

        setFormData(prev => ({
            ...prev,
            otherObservations: prev.otherObservations
                ? prev.otherObservations + '\\n\\n--- From Handwritten Notes ---\\n' + extractedText
                : extractedText
        }));

        alert('✅ Text added to "Other Observations" field!\\n\\nYou can now edit or move it to other fields as needed.');
        setShowOcrModal(false);

        // Cleanup
        setOcrImage(null);
        setOcrImagePreview(null);
        setOcrResult(null);
    };

    /* --- Submit Handler --- */
    const handleSubmit = async () => {
        // ============================================
        // STEP 1: Content Quality Validation (Gibberish & Profanity)
        // ============================================
        const fieldsToValidate = {
            'Property Type': formData.propertyType,
            'What You Saw': formData.whatYouSaw,
            'Family Background': formData.familyBackground,
            'Household Verification': formData.householdVerification,
            'Financial Observation': formData.financialObservation,
            'Loan Details': formData.loanDetails,
            'Education Loan': formData.educationLoan,
            'Student Attitude': formData.studentAttitude,
            'Other Observations': formData.otherObservations,
            'Backup Plan': formData.backupPlan
        };

        // Check each field for gibberish and profanity
        for (const [fieldName, fieldValue] of Object.entries(fieldsToValidate)) {
            if (fieldValue && fieldValue.trim().length > 0) {
                const validation = validateContent(fieldValue, fieldName);
                if (!validation.isValid) {
                    alert(`❌ ${validation.errors[0]}\n\nPlease provide appropriate, meaningful information.`);
                    return;
                }
            }
        }

        // ============================================
        // STEP 2: Required Fields Validation
        // ============================================
        if (!formData.propertyType || !formData.whatYouSaw || formData.recommendation === 'SELECT') {
            alert('Please fill required fields (Property, What You Saw, Recommendation)');
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
        <div className="admin-layout animate-fadeIn">
            {/* Sidebar Navigation */}
            <nav className="side-nav">
                <div className="nav-logo">
                    <img src={logo} alt="Matram Logo" className="header-logo-center" />
                    <span>PV Volunteer Panel</span>
                </div>

                <div className="nav-links">
                    <button className="nav-item" onClick={() => navigate('/students-assign')}>
                        <span className="icon"><Home size={18} /></span> Overview
                    </button>
                    <button className="nav-item active" onClick={() => { }}>
                        <span className="icon"><FileCheck size={18} /></span> PV Form
                    </button>
                </div>

                <div className="nav-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        Sign Out
                    </button>
                </div>
            </nav>

            <main className="main-content">
                <div className="pv-form-page">
                    <header className="page-header">
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontSize: '18px', margin: 0, color: '#2D3748' }}>
                                    🧾 PV Volunteer Additional Comments
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => setShowOcrModal(true)}
                                    className="ocr-scan-btn"
                                    style={{
                                        padding: '10px 20px',
                                        backgroundColor: '#4F46E5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.backgroundColor = '#4338CA'}
                                    onMouseLeave={(e) => e.target.style.backgroundColor = '#4F46E5'}
                                >
                                    📝 Scan Handwritten Notes
                                </button>
                            </div>

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
                                            {img.status === 'enhancing' && (
                                                <div className="status-badge orange">🔧 Enhancing...</div>
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

                                {qualityChecked && !imagesUploaded && (
                                    <div style={{ display: 'inline-block', marginLeft: '10px' }}>
                                        <button
                                            className="upload-images-btn"
                                            onClick={handleUploadImages}
                                            disabled={isUploadingImages || acceptedImages.length < MIN_IMAGES}
                                            style={{
                                                padding: '12px 24px',
                                                backgroundColor: (acceptedImages.length < MIN_IMAGES || isUploadingImages) ? '#CBD5E0' : '#10B981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: (acceptedImages.length < MIN_IMAGES || isUploadingImages) ? 'not-allowed' : 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {isUploadingImages ? 'Uploading...' : 'Upload Images to S3'}
                                        </button>
                                        {acceptedImages.length < MIN_IMAGES && (
                                            <div style={{ fontSize: '12px', color: '#E53E3E', marginTop: '4px' }}>
                                                Need {MIN_IMAGES - acceptedImages.length} more accepted {MIN_IMAGES - acceptedImages.length === 1 ? 'image' : 'images'}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {imagesUploaded && (
                                    <div style={{
                                        marginTop: '12px',
                                        padding: '12px',
                                        backgroundColor: '#D1FAE5',
                                        border: '2px solid #10B981',
                                        borderRadius: '8px',
                                        color: '#065F46',
                                        fontWeight: '600',
                                        textAlign: 'center'
                                    }}>
                                        ✅ Images uploaded successfully! You can now submit the form.
                                    </div>
                                )}
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

                {/* OCR Modal (Agent 7) */}
                {showOcrModal && (
                    <div className="modal-overlay" onClick={() => setShowOcrModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                            <div className="modal-header">
                                <h2>📝 Scan Handwritten Notes</h2>
                                <button className="close-btn" onClick={() => setShowOcrModal(false)}>×</button>
                            </div>

                            <div className="modal-body">
                                <p style={{ marginBottom: '16px', color: '#4A5568' }}>
                                    Upload a photo of your handwritten notes. Agent 7 will extract the text and auto-fill the form.
                                </p>

                                <div style={{ marginBottom: '20px' }}>
                                    <label className="upload-trigger" style={{ display: 'block', textAlign: 'center' }}>
                                        📷 Select Image
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleOcrImageSelect}
                                            style={{ display: 'none' }}
                                        />
                                    </label>
                                </div>

                                {ocrImagePreview && (
                                    <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                                        <img
                                            src={ocrImagePreview}
                                            alt="OCR Preview"
                                            style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '2px solid #E2E8F0' }}
                                        />
                                    </div>
                                )}

                                {ocrResult && (
                                    <div style={{ marginBottom: '20px', padding: '16px', backgroundColor: '#F7FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                                        <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#2D3748' }}>
                                            Extracted Text:
                                        </div>
                                        <div style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: '#4A5568', marginBottom: '12px' }}>
                                            {ocrResult.text}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#718096' }}>
                                            Language: {ocrResult.language} | {ocrResult.composition} | Confidence: {(ocrResult.confidence * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={handleOcrExtract}
                                        disabled={!ocrImage || isProcessingOcr}
                                        style={{
                                            padding: '10px 20px',
                                            backgroundColor: ocrImage && !isProcessingOcr ? '#10B981' : '#CBD5E0',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: ocrImage && !isProcessingOcr ? 'pointer' : 'not-allowed',
                                            fontSize: '14px',
                                            fontWeight: '500'
                                        }}
                                    >
                                        {isProcessingOcr ? '🔄 Extracting...' : '🚀 Extract Text'}
                                    </button>

                                    {ocrResult && (
                                        <button
                                            onClick={handleOcrAutoFill}
                                            style={{
                                                padding: '10px 20px',
                                                backgroundColor: '#4F46E5',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                fontWeight: '500'
                                            }}
                                        >
                                            ✅ Auto-Fill Form
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default PVFormPage;
