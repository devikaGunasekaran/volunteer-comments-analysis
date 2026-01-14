import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, Clock, Video, CheckCircle, X } from 'lucide-react';
import './ScheduleInterviewModal.css';

const API_BASE_URL = 'http://localhost:5000/api';

const ScheduleInterviewModal = ({ student, volunteerId, onClose, onScheduleSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [meetingDetails, setMeetingDetails] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        loadAvailableSlots();
    }, []);

    const loadAvailableSlots = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/vi/available-slots`, {
                withCredentials: true
            });
            if (response.data.success) {
                setAvailableSlots(response.data.slots);
            }
        } catch (err) {
            console.error('Error loading slots:', err);
            setError('Failed to load available time slots.');
        }
    };

    const handleSchedule = async () => {
        if (!selectedSlot) {
            setError('Please select a time slot.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post(`${API_BASE_URL}/vi/schedule-interview`, {
                studentId: student.studentId,
                volunteerId: volunteerId,
                scheduledTime: selectedSlot,
                duration: 60
            }, {
                withCredentials: true
            });

            if (response.data.success) {
                setMeetingDetails(response.data);
                setSuccess(true);
                if (onScheduleSuccess) onScheduleSuccess(response.data);
            }
        } catch (err) {
            console.error('Error scheduling interview:', err);
            setError(err.response?.data?.error || 'Failed to schedule interview. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (success && meetingDetails) {
        return (
            <div className="modal-overlay">
                <div className="modal-content success-modal">
                    <div className="success-icon">
                        <CheckCircle size={48} color="#10B981" />
                    </div>
                    <h2>Interview Scheduled!</h2>
                    <p>A Google Meet has been created for <strong>{student.name}</strong>.</p>

                    <div className="meeting-info-box">
                        <div className="info-row">
                            <Calendar size={18} />
                            <span>{new Date(meetingDetails.scheduledTime).toLocaleDateString()}</span>
                        </div>
                        <div className="info-row">
                            <Clock size={18} />
                            <span>{new Date(meetingDetails.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="info-row link-row">
                            <Video size={18} />
                            <a href={meetingDetails.meetLink} target="_blank" rel="noopener noreferrer" className="meet-link">
                                Join Google Meet
                            </a>
                        </div>
                    </div>

                    <p className="note">Calendar invites have been sent to both you and the student.</p>

                    <button className="close-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Schedule Interview with {student.name}</h3>
                    <button className="close-icon" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    {error && <div className="error-message">{error}</div>}

                    <div className="form-group">
                        <label>Select Date & Time:</label>
                        <select
                            value={selectedSlot}
                            onChange={(e) => setSelectedSlot(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">-- Choose a time slot --</option>
                            {availableSlots.map((slot, index) => (
                                <option key={index} value={slot.value}>
                                    {slot.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="info-box">
                        <p><strong>Note:</strong> Scheduling will automatically:</p>
                        <ul>
                            <li>Create a Google Meet link</li>
                            <li>Send calendar invites to both parties</li>
                            <li>Set up email reminders</li>
                        </ul>
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose} disabled={loading}>Cancel</button>
                    <button
                        className="schedule-btn"
                        onClick={handleSchedule}
                        disabled={loading || !selectedSlot}
                    >
                        {loading ? 'Scheduling...' : 'Confirm Schedule'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleInterviewModal;
