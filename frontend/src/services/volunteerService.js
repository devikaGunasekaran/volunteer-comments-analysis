const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Volunteer Service
const volunteerService = {
    /**
     * Get assigned students for current volunteer
     * @returns {Promise} List of assigned students
     */
    async getAssignedStudents() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/assigned-students`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch assigned students');
            }

            const data = await response.json();
            return {
                success: true,
                students: data.students || [],
                statistics: data.statistics || {}
            };
        } catch (error) {
            console.error('Error fetching assigned students:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get student details
     * @param {string} studentId - Student ID
     * @returns {Promise} Student details
     */
    async getStudentDetails(studentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/student/${studentId}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch student details');
            }

            const data = await response.json();
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching student details:', error);
            return { success: false, error: error.message };
        }
    },

    /**
     * Get student images
     * @param {string} studentId - Student ID
     * @returns {Promise} List of image URLs
     */
    async getStudentImages(studentId) {
        try {
            const response = await fetch(`${API_BASE_URL}/get-images/${studentId}`, {
                credentials: 'include',
            });

            if (!response.ok) {
                return { success: true, images: [] };
            }

            const data = await response.json();
            return { success: true, images: data.images || [] };
        } catch (error) {
            console.error('Error fetching student images:', error);
            return { success: true, images: [] };
        }
    },

    async batchQualityCheck(formData) {
        try {
            // Note: formData must contain 'studentId' and 'images'
            const response = await fetch(`${API_BASE_URL}/api/batch-quality-check`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            if (!response.ok) {
                throw new Error('Failed to perform batch quality check');
            }
            const data = await response.json();
            return { success: true, ...data };
        } catch (error) {
            console.error('Batch quality check error:', error);
            return { success: false, error: error.message };
        }
    },

    async finalUploadBatch(formData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/final-upload-batch`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
            if (!response.ok) {
                throw new Error('Failed to finalize upload batch');
            }
            const data = await response.json();
            return { success: true, ...data };
        } catch (error) {
            console.error('Final upload error:', error);
            return { success: false, error: error.message };
        }
    },

    async submitPV(data) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/submit-pv`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                throw new Error('Failed to submit PV form');
            }
            const responseData = await response.json();
            return { success: true, ...responseData };
        } catch (error) {
            console.error('Submit PV error:', error);
            return { success: false, error: error.message };
        }
    },
};

export default volunteerService;
