/**
 * VI Volunteer Service
 * API calls for VI volunteer operations
 */

import axios from 'axios';

const API_BASE = 'http://localhost:5000';

const viVolunteerService = {
    /**
     * Get students assigned to logged-in VI volunteer
     */
    getAssignedStudents: async () => {
        try {
            const response = await axios.get(`${API_BASE}/vi/api/assigned-students`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching assigned students:', error);
            throw error;
        }
    },

    /**
     * Get complete student details for interview
     * @param {string} studentId - Student ID
     */
    getStudentDetails: async (studentId) => {
        try {
            const response = await axios.get(
                `${API_BASE}/vi/api/student/${studentId}`,
                {
                    withCredentials: true
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching student details:', error);
            throw error;
        }
    },

    /**
     * Submit VI interview results
     * @param {string} studentId - Student ID
     * @param {string} recommendation - SELECT, REJECT, or ON HOLD
     * @param {string} remarks - Detailed comments
     */
    submitInterview: async (studentId, recommendation, remarks) => {
        try {
            const response = await axios.post(
                `${API_BASE}/vi/api/submit-interview/${studentId}`,
                {
                    recommendation,
                    remarks
                },
                {
                    withCredentials: true
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error submitting interview:', error);
            throw error;
        }
    },

    /**
     * Get VI volunteer's completed interviews
     */
    getCompletedInterviews: async () => {
        try {
            const response = await axios.get(`${API_BASE}/vi/api/completed-interviews`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching completed interviews:', error);
            throw error;
        }
    }
};

export default viVolunteerService;
