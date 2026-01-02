/**
 * Superadmin Service
 * API calls for superadmin virtual interview management
 */

import axios from 'axios';

const API_BASE = 'http://localhost:5000';

const superadminService = {
    /**
     * Get students approved by admin (ready for VI assignment)
     */
    getApprovedStudents: async () => {
        try {
            const response = await axios.get(`${API_BASE}/superadmin/api/approved-students`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching approved students:', error);
            throw error;
        }
    },

    /**
     * Get list of VI volunteers
     */
    getVIVolunteers: async () => {
        try {
            const response = await axios.get(`${API_BASE}/superadmin/api/vi-volunteers`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching VI volunteers:', error);
            throw error;
        }
    },

    /**
     * Assign VI volunteer to student
     * @param {string} studentId - Student ID
     * @param {string} volunteerId - Volunteer ID (optional if email provided)
     * @param {string} volunteerEmail - Volunteer email (optional if ID provided)
     */
    assignVIVolunteer: async (studentId, volunteerId = null, volunteerEmail = null) => {
        try {
            const response = await axios.post(
                `${API_BASE}/superadmin/api/assign-vi-volunteer`,
                {
                    studentId,
                    volunteerId,
                    volunteerEmail
                },
                {
                    withCredentials: true
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error assigning VI volunteer:', error);
            throw error;
        }
    },

    /**
     * Get all VI assignments
     */
    getVIAssignments: async () => {
        try {
            const response = await axios.get(`${API_BASE}/superadmin/api/vi-assignments`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching VI assignments:', error);
            throw error;
        }
    },

    /**
     * Get completed virtual interviews
     */
    getCompletedVI: async () => {
        try {
            const response = await axios.get(`${API_BASE}/superadmin/api/completed-vi`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching completed VIs:', error);
            throw error;
        }
    },

    /**
     * Get VI details for specific student
     * @param {string} studentId - Student ID
     */
    getVIDetails: async (studentId) => {
        try {
            const response = await axios.get(
                `${API_BASE}/superadmin/api/vi-details/${studentId}`,
                {
                    withCredentials: true
                }
            );
            return response.data;
        } catch (error) {
            console.error('Error fetching VI details:', error);
            throw error;
        }
    }
};

export default superadminService;
