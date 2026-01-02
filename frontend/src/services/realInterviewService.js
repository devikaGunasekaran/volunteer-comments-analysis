import axios from 'axios';

const API_URL = 'http://localhost:5000/real-interview/api';

const realInterviewService = {
    /**
     * Get students eligible for Real Interview (VI-selected students)
     */
    getEligibleStudents: async () => {
        try {
            const response = await axios.get(`${API_URL}/eligible-students`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching eligible students:', error);
            throw error;
        }
    },

    /**
     * Get all Real Interview volunteers
     */
    getRIVolunteers: async () => {
        try {
            const response = await axios.get(`${API_URL}/ri-volunteers`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching RI volunteers:', error);
            throw error;
        }
    },

    /**
     * Assign a Real Interview volunteer to a student
     * @param {string} studentId - Student ID
     * @param {string} volunteerId - Volunteer ID
     */
    assignVolunteer: async (studentId, volunteerId) => {
        try {
            const response = await axios.post(
                `${API_URL}/assign-volunteer`,
                { studentId, volunteerId },
                { withCredentials: true }
            );
            return response.data;
        } catch (error) {
            console.error('Error assigning RI volunteer:', error);
            throw error;
        }
    },

    /**
     * Get all completed Real Interviews with remarks
     */
    getCompletedInterviews: async () => {
        try {
            const response = await axios.get(`${API_URL}/completed`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching completed RIs:', error);
            throw error;
        }
    },

    /**
     * Get Real Interview statistics
     */
    getRIStats: async () => {
        try {
            const response = await axios.get(`${API_URL}/stats`, {
                withCredentials: true
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching RI stats:', error);
            throw error;
        }
    }
};

export default realInterviewService;
