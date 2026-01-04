import api from './api';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// TV Volunteer Service
const tvService = {
    /**
     * Get assigned students for current TV volunteer
     * @returns {Promise} List of assigned students
     */
    async getAssignedStudents() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const volunteerId = user?.volunteerId;

            if (!volunteerId) throw new Error('Volunteer ID not found');

            const response = await fetch(`${API_BASE_URL}/api/tv-volunteer/assigned-students?volunteerId=${volunteerId}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch assigned students');
            }

            const data = await response.json();
            return { success: true, students: data.students || [] };
        } catch (error) {
            console.error('Error fetching assigned students:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Submit televerification form
     * @param {object} data - Verification data
     * @returns {Promise} Result of submission
     */
    async submitVerification(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/tv-volunteer/submit`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                throw new Error('Failed to submit verification');
            }

            const responseData = await response.json();
            return { success: true, ...responseData };
        } catch (error) {
            console.error('Submit TV error:', error);
            return { success: false, error: error.message };
        }
    }
};

export default tvService;
