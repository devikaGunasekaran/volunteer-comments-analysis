import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';
import logo from '../../assets/logo_icon.jpg';

const LoginPage = () => {
    const [volunteerId, setVolunteerId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5000/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ volunteerId, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                // Store user data in localStorage
                localStorage.setItem('user', JSON.stringify(data.user));
                localStorage.setItem('token', data.token);

                // Redirect based on role
                if (data.user.role === 'pv') {
                    navigate('/students-assign');
                } else if (data.user.role === 'admin') {
                    navigate('/admin/assign');
                } else {
                    navigate('/dashboard');
                }
            } else {
                setError(data.message || 'Invalid credentials!');
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="left"></div>

                <div className="right">
                    <img src={logo} alt="Maatram Logo" className="logo" />

                    <h2>"Welcome, Maatram Volunteers!"</h2>

                    <form onSubmit={handleSubmit}>
                        <input
                            type="text"
                            name="volunteerId"
                            placeholder="Enter User ID"
                            value={volunteerId}
                            onChange={(e) => setVolunteerId(e.target.value)}
                            required
                            disabled={loading}
                        />

                        <input
                            type="password"
                            name="password"
                            placeholder="Enter Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />

                        {error && <div className="error-message">{error}</div>}

                        <button type="submit" disabled={loading}>
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="footer-text">© 2025 Maatram Foundation</div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
