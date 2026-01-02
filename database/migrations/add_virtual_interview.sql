-- Migration: Add Virtual Interview System (FINAL VERSION)
-- This version is compatible with your existing database structure

-- ============================================
-- 1. Create VirtualInterview Table
-- ============================================
CREATE TABLE IF NOT EXISTS VirtualInterview (
    viId INT AUTO_INCREMENT PRIMARY KEY,
    studentId VARCHAR(50) NOT NULL COMMENT 'Student ID - matches Student table',
    volunteerId VARCHAR(20) DEFAULT NULL COMMENT 'VI Volunteer ID',
    assignedDate DATETIME DEFAULT NULL,
    interviewDate DATETIME DEFAULT NULL,
    status VARCHAR(50) DEFAULT NULL COMMENT 'PENDING, SCHEDULED, COMPLETED, RECOMMENDED, NOT_RECOMMENDED',
    interviewNotes TEXT DEFAULT NULL,
    technicalScore INT DEFAULT NULL COMMENT 'Score 0-100',
    communicationScore INT DEFAULT NULL COMMENT 'Score 0-100',
    overallRecommendation VARCHAR(50) DEFAULT NULL COMMENT 'STRONG_YES, YES, MAYBE, NO',
    comments TEXT DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_student (studentId),
    INDEX idx_volunteer (volunteerId),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 2. Add Superadmin User (without createdAt)
-- ============================================
-- Password: superadmin123 (change after first login)
INSERT INTO Volunteer (volunteerId, name, email, phone, password, role)
VALUES (
    'SA001', 
    'Super Admin', 
    'superadmin@maatram.org', 
    '9876543210', 
    'superadmin123',  -- Plain text password for current auth system
    'superadmin'
)
ON DUPLICATE KEY UPDATE 
    role = 'superadmin',
    password = 'superadmin123';
    
-- ============================================
-- 3. Verify Installation
-- ============================================
SELECT 'VirtualInterview table created successfully' AS Status;

SELECT volunteerId, name, email, role 
FROM Volunteer 
WHERE role = 'superadmin';
