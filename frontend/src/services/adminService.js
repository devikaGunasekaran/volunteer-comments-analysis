import api from './api';

const adminService = {
    // Get all pending students for admin dashboard
    async getPendingStudents() {
        return api.get('/admin/api/pending-students');
    },

    // Get specific student details for decision view
    async getStudentDetails(studentId) {
        return api.get(`/admin/api/student/${studentId}`);
    },

    // Submit final decision
    async submitFinalDecision(studentId, status, remarks = '') {
        return api.post(`/admin/final_status_update/${studentId}`, {
            admin_status: status,
            admin_remarks: remarks
        });
    }
};

export default adminService;
