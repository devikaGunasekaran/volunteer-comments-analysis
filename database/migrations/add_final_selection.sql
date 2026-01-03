-- Add Final Selection columns to Student table
ALTER TABLE Student 
ADD COLUMN finalDecision ENUM('SELECTED', 'REJECTED') DEFAULT NULL,
ADD COLUMN finalRemarks TEXT,
ADD COLUMN finalDecisionDate DATETIME,
ADD COLUMN finalDecisionBy VARCHAR(20);
