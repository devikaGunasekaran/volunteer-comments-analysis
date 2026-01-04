/**
 * Educational Details Service
 * API calls for managing educational information
 */

import axios from 'axios';

const API_BASE = 'http://localhost:5000';

const educationalService = {
    /**
     * Save educational details for a student
     * @param {string} studentId - Student ID
     * @param {string} collegeName - College name
     * @param {string} degree - Degree (e.g., B.Tech, B.Sc)
     * @param {string} stream - Stream (e.g., Engineering, Arts)
     * @param {string} branch - Branch/Specialization (e.g., Civil, Mechanical, AIDS)
     * @param {number} yearOfPassing - Year of passing
     */
    saveDetails: async (studentId, collegeName, degree, stream, branch, yearOfPassing) => {
        try {
            const response = await axios.post(
                `${API_BASE}/educational/api/save-details`,
                { studentId, collegeName, degree, stream, branch, yearOfPassing },
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            console.error('Error saving educational details:', error);
            throw error;
        }
    },

    /**
     * Get educational details for a specific student
     * @param {string} studentId - Student ID
     */
    getDetails: async (studentId) => {
        try {
            const response = await axios.get(
                `${API_BASE}/educational/api/get-details/${studentId}`,
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching educational details:', error);
            throw error;
        }
    },

    /**
     * Get all students with educational details
     */
    getAllStudentsWithDetails: async () => {
        try {
            const response = await axios.get(
                `${API_BASE}/educational/api/all-students-with-details`,
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching students with educational details:', error);
            throw error;
        }
    },

    /**
     * Get complete student profile with all journey details
     * @param {string} studentId - Student ID
     */
    getStudentProfile: async (studentId) => {
        try {
            const response = await axios.get(
                `${API_BASE}/educational/api/student-profile/${studentId}`,
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching student profile:', error);
            throw error;
        }
    }
};

export default educationalService;
