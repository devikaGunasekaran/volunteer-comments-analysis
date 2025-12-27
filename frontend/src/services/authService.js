// Authentication Service
const authService = {
    /**
     * Login user
     * @param {string} volunteerId - Volunteer ID
     * @param {string} password - Password
     * @returns {Promise} Response with user data and token
     */
    async login(volunteerId, password) {
        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ volunteerId, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store user data
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);
                return { success: true, data };
            } else {
                return { success: false, error: data.message || 'Login failed' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Connection error. Please try again.' };
        }
    },

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.location.href = '/';
    },

    /**
     * Get current user from localStorage
     * @returns {Object|null} User object or null
     */
    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    /**
     * Check if user is authenticated
     * @returns {boolean}
     */
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    /**
     * Get user role
     * @returns {string|null} User role or null
     */
    getUserRole() {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    },
};

export default authService;
