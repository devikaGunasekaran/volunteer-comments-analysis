-- Create RealInterview table for tracking real/physical interviews after VI selection
CREATE TABLE IF NOT EXISTS RealInterview (
    riId INT AUTO_INCREMENT PRIMARY KEY,
    studentId VARCHAR(20) NOT NULL,
    volunteerId VARCHAR(20),
    assignedDate DATETIME,
    interviewDate DATETIME,
    status ENUM('PENDING', 'COMPLETED', 'RECOMMENDED', 'NOT_RECOMMENDED') DEFAULT 'PENDING',
    technicalScore INT,
    communicationScore INT,
    overallRecommendation ENUM('STRONG_YES', 'YES', 'MAYBE', 'NO'),
    remarks TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (studentId) REFERENCES Student(studentId),
    FOREIGN KEY (volunteerId) REFERENCES Volunteer(volunteerId)
);

-- Add sample Real Interview volunteers
INSERT INTO Volunteer (volunteerId, name, email, password, role) VALUES
('RI001', 'Real Interview Volunteer 1', 'ri1@example.com', 'ri123', 'ri'),
('RI002', 'Real Interview Volunteer 2', 'ri2@example.com', 'ri123', 'ri'),
('RI003', 'Real Interview Volunteer 3', 'ri3@example.com', 'ri123', 'ri'),
('RI004', 'Real Interview Volunteer 4', 'ri4@example.com', 'ri123', 'ri'),
('RI005', 'Real Interview Volunteer 5', 'ri5@example.com', 'ri123', 'ri');
