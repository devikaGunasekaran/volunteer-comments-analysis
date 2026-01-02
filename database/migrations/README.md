# Database Migrations

## Overview
This folder contains SQL migration files for database schema changes. Migrations should be run in numerical order.

## Migration Files
- `001_initial_schema.sql` - Initial database schema (if needed)
- `002_add_virtual_interview.sql` - Virtual Interview system (2025-01-30)

## How to Run Migrations

### Option 1: MySQL Command Line
```bash
# Connect to MySQL
mysql -u your_username -p

# Select database
USE scholarship_db;

# Run migration
SOURCE E:/PROJECT/volunteer-comments-analysis/database/migrations/002_add_virtual_interview.sql;
```

### Option 2: MySQL Workbench
1. Open MySQL Workbench
2. Connect to your database
3. Open the migration file
4. Execute the SQL script

### Option 3: Command Line (Windows)
```bash
mysql -u root -p scholarship_db < "E:\PROJECT\volunteer-comments-analysis\database\migrations\002_add_virtual_interview.sql"
```

## Important Notes

### Before Running Migration 002:
1. **Update Superadmin Password**: 
   - Generate a password hash using Python:
   ```python
   from werkzeug.security import generate_password_hash
   password_hash = generate_password_hash('your_secure_password')
   print(password_hash)
   ```
   - Replace the password hash in the SQL file

2. **Backup Your Database**:
   ```bash
   mysqldump -u root -p scholarship_db > backup_before_migration_002.sql
   ```

3. **Verify Prerequisites**:
   - Ensure `Student` table exists
   - Ensure `Volunteer` table exists

## After Running Migration

### Verify Installation:
```sql
-- Check VirtualInterview table
DESCRIBE VirtualInterview;

-- Check superadmin user
SELECT * FROM Volunteer WHERE role = 'superadmin';
```

## Rollback (If Needed)

To rollback migration 002:
```sql
-- Drop VirtualInterview table
DROP TABLE IF EXISTS VirtualInterview;

-- Remove superadmin user
DELETE FROM Volunteer WHERE volunteerId = 'SA001';
```

## Team Workflow

1. **Developer makes changes**:
   - Create new migration file
   - Commit to Git
   - Push to repository

2. **Team members update**:
   ```bash
   git pull origin main
   cd database/migrations
   # Run new migration files
   ```

## Migration Naming Convention
- Format: `XXX_description.sql`
- XXX = Sequential number (001, 002, 003...)
- description = Brief description in snake_case

## Questions?
Contact the database administrator or check the project documentation.
