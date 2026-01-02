-- Add Sample VI (Virtual Interview) Volunteers
-- Run this script to add VI volunteers to the database

-- Insert VI Volunteers
INSERT INTO Volunteer (volunteerId, name, email, phone, password, role)
VALUES 
    ('VI001', 'Rajesh Kumar', 'rajesh.vi@maatram.org', '9876543211', 'vi123', 'vi'),
    ('VI002', 'Priya Sharma', 'priya.vi@maatram.org', '9876543212', 'vi123', 'vi'),
    ('VI003', 'Amit Patel', 'amit.vi@maatram.org', '9876543213', 'vi123', 'vi'),
    ('VI004', 'Sneha Reddy', 'sneha.vi@maatram.org', '9876543214', 'vi123', 'vi'),
    ('VI005', 'Karthik Iyer', 'karthik.vi@maatram.org', '9876543215', 'vi123', 'vi')
ON DUPLICATE KEY UPDATE 
    role = 'vi',
    password = 'vi123';

-- Verify the VI volunteers were added
SELECT volunteerId, name, email, role 
FROM Volunteer 
WHERE role = 'vi'
ORDER BY volunteerId;
