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
    },

<<<<<<< HEAD
    // Physical Verification Workflow APIs

    // Get students from TeleVerification with status='SELECTED'
    async getTVSelectedStudents() {
        return api.get('/admin/api/tv-selected-students');
    },

    // Get all volunteers
    async getVolunteers() {
        return api.get('/admin/api/volunteers');
    },

    // Assign volunteer to student for PV
    async assignPVVolunteer(studentId, volunteerId, volunteerEmail = null) {
        return api.post('/admin/api/assign-pv-volunteer', {
            studentId,
            volunteerId,
            volunteerEmail
        });
    },

    // Get students with completed PV
    async getCompletedPVStudents() {
        return api.get('/admin/api/completed-pv-students');
=======
    // --- TV Workflow ---

    // Get unassigned TV students
    async getUnassignedTVStudents() {
        return api.get('/admin/api/unassigned-tv-students');
    },

    // Get all TV volunteers
    async getTVVolunteers() {
        return api.get('/admin/api/tv-volunteers');
    },

    // Assign students to TV volunteer
    async assignTV(studentIds, volunteerId) {
        return api.post('/admin/api/assign-tv', { studentIds, volunteerId });
    },

<<<<<<< Updated upstream
    // Get submitted TV reports for review
    async getTVReports() {
        return api.get('/admin/api/submitted-tv-reports');
    },

    // Admin decision on TV review
    async reviewTVSubmission(studentId, decision, remarks = '') {
        return api.post('/admin/api/review-tv-submission', { studentId, decision, remarks });
=======
    // Get students with completed PV
    async getCompletedPVStudents() {
        return api.get('/admin/api/completed-pv-students');
    },

    // Get PV statistics for admin dashboard
    async getPVStatistics() {
        return api.get('/admin/api/pv-statistics');
>>>>>>> Stashed changes
>>>>>>> Tarun
    }
};

export default adminService;

