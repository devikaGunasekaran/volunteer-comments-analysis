# MySQL Installation and Database Setup Guide

This guide will help you install MySQL and import the project database on your system.

---

## Step 1: Install MySQL

### Windows

1. **Download MySQL Installer**
   - Go to: https://dev.mysql.com/downloads/installer/
   - Download **MySQL Installer for Windows** (mysql-installer-web-community)

2. **Run the Installer**
   - Double-click the downloaded file
   - Choose **"Developer Default"** or **"Server only"**
   - Click **Next**

3. **Configuration**
   - Set **Root Password** (remember this!)
   - Keep default port: **3306**
   - Click **Next** and **Execute**

4. **Verify Installation**
   ```powershell
   mysql --version
   ```
   If this doesn't work, add MySQL to PATH:
   - Add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to System PATH

### macOS

**Option 1: Using Homebrew (Recommended)**
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MySQL
brew install mysql

# Start MySQL service
brew services start mysql

# Secure installation
mysql_secure_installation
```

**Option 2: Using DMG Installer**
- Download from: https://dev.mysql.com/downloads/mysql/
- Install the .dmg file
- Follow the installation wizard

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install MySQL Server
sudo apt install mysql-server

# Start MySQL service
sudo systemctl start mysql

# Enable MySQL to start on boot
sudo systemctl enable mysql

# Secure installation
sudo mysql_secure_installation
```

---

## Step 2: Verify MySQL is Running

### Windows
```powershell
# Check if MySQL service is running
Get-Service MySQL*
```

### macOS/Linux
```bash
# Check MySQL status
sudo systemctl status mysql
# OR
brew services list | grep mysql
```

---

## Step 3: Create Database User (Optional but Recommended)

Instead of using root, create a dedicated user:

```sql
# Login to MySQL as root
mysql -u root -p

# Create database
CREATE DATABASE volunteer_comments_db;

# Create user (replace 'yourpassword' with a strong password)
CREATE USER 'volunteer_dev'@'localhost' IDENTIFIED BY 'yourpassword';

# Grant privileges
GRANT ALL PRIVILEGES ON volunteer_comments_db.* TO 'volunteer_dev'@'localhost';

# Apply changes
FLUSH PRIVILEGES;

# Exit
EXIT;
```

---

## Step 4: Set Up Project Environment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd volunteer-comments-analysis
   ```

2. **Create `.env` file**
   
   Create a file named `.env` in the project root with:
   
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=volunteer_dev
   DB_PASSWORD=yourpassword
   DB_NAME=volunteer_comments_db
   
   # AI API Keys (Optional for UI work - can leave empty)
   GEMINI_API_KEY=
   GROQ_API_KEY=
   
   # RAG Configuration (Disable for UI development)
   RAG_ENABLED=false
   CHROMA_DB_PATH=./chroma_db
   RAG_COLLECTION_NAME=student_cases
   RAG_TOP_K=5
   ```

---

## Step 5: Import the Database

### Method 1: Using the Import Script (Easiest)

**Windows:**
```powershell
# Make sure you have the database dump file
# Run the import script
.\import_database.ps1
```

**macOS/Linux:**
```bash
# Make the script executable
chmod +x import_database.sh

# Run it
./import_database.sh
```

### Method 2: Manual Import

**Windows:**
```powershell
mysql -u volunteer_dev -p volunteer_comments_db < database_dump_2025-12-27.sql
```

**macOS/Linux:**
```bash
mysql -u volunteer_dev -p volunteer_comments_db < database_dump_2025-12-27.sql
```

When prompted, enter your MySQL password.

---

## Step 6: Verify Database Import

```sql
# Login to MySQL
mysql -u volunteer_dev -p

# Use the database
USE volunteer_comments_db;

# Show tables
SHOW TABLES;

# Check if data exists
SELECT COUNT(*) FROM Student;
SELECT COUNT(*) FROM Volunteer;

# Exit
EXIT;
```

You should see tables like:
- Student
- Volunteer
- PhysicalVerification
- TeleVerification
- FinalImages
- ImageAnalysis
- ScholarshipDetails
- etc.

---

## Step 7: Test the Application

```bash
# Activate virtual environment
# Windows:
.\venv\Scripts\Activate.ps1

# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the app
python app.py
```

Visit: **http://localhost:5000**

---

## Troubleshooting

### Issue: "mysql: command not found"

**Windows:**
- Add MySQL bin folder to PATH: `C:\Program Files\MySQL\MySQL Server 8.0\bin`

**macOS:**
```bash
export PATH="/usr/local/mysql/bin:$PATH"
# Add to ~/.zshrc or ~/.bash_profile to make permanent
```

**Linux:**
```bash
sudo apt install mysql-client
```

### Issue: "Access denied for user"

- Check username and password in `.env` file
- Make sure you created the user with proper privileges
- Try using root user temporarily to debug

### Issue: "Can't connect to MySQL server"

- Make sure MySQL service is running
- Check if port 3306 is not blocked by firewall
- Verify `DB_HOST=localhost` in `.env`

### Issue: "Database does not exist"

```sql
# Create it manually
mysql -u root -p
CREATE DATABASE volunteer_comments_db;
EXIT;
```

### Issue: Import fails with "Unknown database"

The import script should create the database automatically. If not:
```sql
mysql -u root -p -e "CREATE DATABASE volunteer_comments_db;"
```

Then run the import again.

---

## Quick Reference Commands

### Start/Stop MySQL

**Windows:**
```powershell
# Start
net start MySQL80

# Stop
net stop MySQL80
```

**macOS:**
```bash
brew services start mysql
brew services stop mysql
```

**Linux:**
```bash
sudo systemctl start mysql
sudo systemctl stop mysql
```

### Reset MySQL Root Password (if forgotten)

**Windows:**
1. Stop MySQL service
2. Start MySQL in safe mode
3. Login without password
4. Reset password

**macOS/Linux:**
```bash
sudo mysql
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
EXIT;
```

---

## Sample Test Login Credentials

After importing the database, you can use these test credentials (if available):

**PV Volunteer:**
- Volunteer ID: `TEST001` (or check database)
- Password: `password123` (or as set in database)

**Admin:**
- Volunteer ID: `ADMIN001` (or check database)
- Password: `admin123` (or as set in database)

**To check available volunteers:**
```sql
mysql -u volunteer_dev -p
USE volunteer_comments_db;
SELECT volunteerId, role, name FROM Volunteer;
```

---

## Next Steps

Once your database is set up and running:

1. ✅ Read `COLLABORATION_GUIDE.md` for project structure
2. ✅ Create your feature branch
3. ✅ Start working on UI improvements
4. ✅ Test your changes locally
5. ✅ Commit and push to your branch
6. ✅ Create a Pull Request

---

## Need Help?

- **MySQL Documentation**: https://dev.mysql.com/doc/
- **Project Issues**: Create an issue on GitHub
- **Contact**: Reach out to the project maintainer

Happy developing! 🚀
