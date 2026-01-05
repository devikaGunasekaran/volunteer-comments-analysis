import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { RefreshCw, Users, CheckCircle, XCircle, TrendingUp, Brain, ArrowLeft, Award, UserCheck } from 'lucide-react';
import authService from '../../services/authService';
import logo from '../../assets/logo_icon.jpg';
import './SuperadminAnalyticsDashboard.css';

const SuperadminAnalyticsDashboard = () => {
    const navigate = useNavigate();
    const [selectedYear, setSelectedYear] = useState('2024');
    const [lastUpdate, setLastUpdate] = useState(new Date());

    // Hardcoded demo data
    const dashboardData = {
        // Simplified AI metrics
        aiMetrics: {
            totalProcessed: 564,
            aiAccuracy: 87.5,
            perfectMatches: 245,  // Both AI and Admin agreed
            aiCorrect: 78,         // AI was right, Admin initially wrong
            adminCorrect: 52       // Admin was right, AI initially wrong
        },
        applicationStats: {
            totalApplications: 564,
            selected: 297,
            rejected: 267,
            pending: 45
        },
        genderDistribution: {
            male: 312,
            female: 252
        },
        yearWiseData: [
            { year: '2020', applications: 423, selected: 234, rejected: 189 },
            { year: '2021', applications: 487, selected: 267, rejected: 220 },
            { year: '2022', applications: 534, selected: 298, rejected: 236 },
            { year: '2023', applications: 598, selected: 345, rejected: 253 },
            { year: '2024', applications: 564, selected: 297, rejected: 267 }
        ],
        courseWiseAdmission: [
            { course: 'Computer Science', male: 89, female: 67 },
            { course: 'Mechanical', male: 76, female: 34 },
            { course: 'Civil', male: 54, female: 43 },
            { course: 'Literature', male: 32, female: 54 },
            { course: 'Economics', male: 28, female: 38 },
            { course: 'Physics', male: 33, female: 26 }
        ]
    };

    const handleRefresh = () => {
        setLastUpdate(new Date());
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const years = ['2020', '2021', '2022', '2023', '2024'];

    return (
        <div className="analytics-dashboard">
            {/* Header */}
            <header className="analytics-header">
                <button onClick={handleLogout} className="logout-btn">
                    LOGOUT
                </button>
                <img src={logo} alt="Logo" className="header-logo" />
                <div className="header-content">
                    <div className="header-title-section">
                        <h1 className="header-title">Analytics & Reports Dashboard</h1>
                        <p className="header-subtitle">Comprehensive overview of scholarship selection process</p>
                    </div>
                    <div className="header-controls">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="filter-select"
                        >
                            {years.map(year => (
                                <option key={year} value={year}>Year: {year}</option>
                            ))}
                        </select>
                        <div className="last-update">
                            <p className="update-label">Last updated</p>
                            <p className="update-time">{lastUpdate.toLocaleTimeString()}</p>
                        </div>
                        <button onClick={handleRefresh} className="refresh-btn">
                            <RefreshCw className="refresh-icon" />
                            Refresh
                        </button>
                    </div>
                </div>
            </header>

            <div className="analytics-content">
                {/* Back Button */}
                <button onClick={() => navigate('/superadmin/dashboard')} className="back-btn">
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                {/* Key Metrics Overview */}
                <div className="section">
                    <h2 className="section-title">
                        <Award className="section-icon" />
                        Key Performance Metrics
                    </h2>
                    <p className="section-description">
                        Overall statistics for the current selection cycle
                    </p>
                    <div className="metrics-grid-4">
                        <div className="metric-card metric-blue">
                            <div className="metric-icon-wrapper">
                                <Users className="metric-icon" />
                            </div>
                            <p className="metric-label">Total Applications</p>
                            <p className="metric-value">{dashboardData.applicationStats.totalApplications}</p>
                            <p className="metric-sublabel">Processed by AI</p>
                        </div>

                        <div className="metric-card metric-green">
                            <div className="metric-icon-wrapper">
                                <CheckCircle className="metric-icon" />
                            </div>
                            <p className="metric-label">Selected</p>
                            <p className="metric-value">{dashboardData.applicationStats.selected}</p>
                            <p className="metric-sublabel">{((dashboardData.applicationStats.selected / dashboardData.applicationStats.totalApplications) * 100).toFixed(1)}% Selection Rate</p>
                        </div>

                        <div className="metric-card metric-red">
                            <div className="metric-icon-wrapper">
                                <XCircle className="metric-icon" />
                            </div>
                            <p className="metric-label">Rejected</p>
                            <p className="metric-value">{dashboardData.applicationStats.rejected}</p>
                            <p className="metric-sublabel">{((dashboardData.applicationStats.rejected / dashboardData.applicationStats.totalApplications) * 100).toFixed(1)}% Rejection Rate</p>
                        </div>

                        <div className="metric-card metric-yellow">
                            <div className="metric-icon-wrapper">
                                <TrendingUp className="metric-icon" />
                            </div>
                            <p className="metric-label">Pending Review</p>
                            <p className="metric-value">{dashboardData.applicationStats.pending}</p>
                            <p className="metric-sublabel">Awaiting Decision</p>
                        </div>
                    </div>
                </div>

                {/* AI Performance - Simplified */}
                <div className="section">
                    <h2 className="section-title">
                        <Brain className="section-icon" />
                        AI System Performance
                    </h2>
                    <p className="section-description">
                        Comparing AI recommendations with admin final decisions
                    </p>
                    <div className="metrics-grid-4">
                        <div className="metric-card metric-primary">
                            <div className="metric-icon-wrapper">
                                <TrendingUp className="metric-icon" />
                            </div>
                            <p className="metric-label">AI Accuracy</p>
                            <p className="metric-value">{dashboardData.aiMetrics.aiAccuracy}%</p>
                            <p className="metric-sublabel">Correct Predictions</p>
                        </div>

                        <div className="metric-card metric-success">
                            <div className="metric-icon-wrapper">
                                <CheckCircle className="metric-icon" />
                            </div>
                            <p className="metric-label">Both Agreed</p>
                            <p className="metric-value">{dashboardData.aiMetrics.perfectMatches}</p>
                            <p className="metric-sublabel">AI & Admin Same Decision</p>
                        </div>

                        <div className="metric-card metric-warning">
                            <div className="metric-icon-wrapper">
                                <Brain className="metric-icon" />
                            </div>
                            <p className="metric-label">AI Recommended</p>
                            <p className="metric-value">{dashboardData.aiMetrics.aiCorrect}</p>
                            <p className="metric-sublabel">Admin Initially Rejected</p>
                        </div>

                        <div className="metric-card metric-orange">
                            <div className="metric-icon-wrapper">
                                <Users className="metric-icon" />
                            </div>
                            <p className="metric-label">Admin Recommended</p>
                            <p className="metric-value">{dashboardData.aiMetrics.adminCorrect}</p>
                            <p className="metric-sublabel">AI Initially Rejected</p>
                        </div>
                    </div>
                </div>

                {/* Gender Distribution and Year Trends */}
                <div className="charts-row">
                    <div className="chart-card">
                        <h2 className="chart-title">Gender Distribution</h2>
                        <p className="chart-description">Male vs Female applicants</p>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Male', value: dashboardData.genderDistribution.male },
                                        { name: 'Female', value: dashboardData.genderDistribution.female }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                    outerRadius={90}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#ec4899" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="chart-card">
                        <h2 className="chart-title">Course-wise Gender Distribution</h2>
                        <p className="chart-description">Male and female students across different courses</p>
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={dashboardData.courseWiseAdmission}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="course" stroke="#6b7280" angle={-20} textAnchor="end" height={80} />
                                <YAxis stroke="#6b7280" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                />
                                <Legend />
                                <Bar dataKey="male" fill="#3b82f6" name="Male" radius={[8, 8, 0, 0]} />
                                <Bar dataKey="female" fill="#ec4899" name="Female" radius={[8, 8, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Year-wise Trends */}
                <div className="chart-card">
                    <h2 className="chart-title">Historical Trends (2020-2024)</h2>
                    <p className="chart-description">Application volumes and selection outcomes over the years</p>
                    <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={dashboardData.yearWiseData}>
                            <defs>
                                <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSelected" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorRejected" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="year" stroke="#6b7280" />
                            <YAxis stroke="#6b7280" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Area type="monotone" dataKey="applications" stroke="#3b82f6" fillOpacity={1} fill="url(#colorApplications)" name="Applications" />
                            <Area type="monotone" dataKey="selected" stroke="#10b981" fillOpacity={1} fill="url(#colorSelected)" name="Selected" />
                            <Area type="monotone" dataKey="rejected" stroke="#ef4444" fillOpacity={1} fill="url(#colorRejected)" name="Rejected" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default SuperadminAnalyticsDashboard;
