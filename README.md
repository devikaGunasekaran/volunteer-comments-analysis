# Volunteer Comments Analysis - Backend Restructured

## Project Structure

```
volunteer-comments-analysis/
├── backend/                      # NEW: Modular backend
│   ├── __init__.py
│   ├── app.py                   # Main Flask app with blueprints
│   ├── config.py                # Centralized configuration
│   ├── routes/                  # Route blueprints
│   │   ├── __init__.py
│   │   ├── auth.py             # Authentication routes
│   │   ├── volunteer.py        # PV volunteer routes
│   │   ├── admin.py            # Admin routes
│   │   ├── analytics.py        # Analytics API
│   │   └── scholarship.py      # Scholarship management
│   ├── services/                # Business logic services
│   │   ├── __init__.py
│   │   ├── ai_service.py       # AI processing (Gemini/Groq)
│   │   ├── pv_graph.py         # LangGraph workflow
│   │   ├── pv_process.py       # PV processing wrapper
│   │   ├── rag_service.py      # RAG knowledge base
│   │   └── s3_service.py       # AWS S3 operations
│   ├── models/                  # Data models
│   │   ├── __init__.py
│   │   └── database.py         # DB connection & helpers
│   └── utils/                   # Utilities
│       └── __init__.py
├── templates/                   # HTML templates (unchanged)
├── static/                      # Static files (unchanged)
├── uploads/                     # Upload directory
├── venv/                        # Virtual environment
├── app.py                       # Main entry point (NEW)
├── app_old.py                   # Backup of old monolithic app
├── requirements.txt
├── .env
└── README.md
```

## Quick Start

### 1. Activate Virtual Environment

**PowerShell:**
```powershell
.\venv\Scripts\Activate.ps1
```

**CMD:**
```cmd
.\venv\Scripts\activate.bat
```

**Git Bash/Linux/Mac:**
```bash
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Application

**Option 1: Using run script**
```powershell
.\run.ps1
```

**Option 2: Direct command**
```bash
python app.py
```

The application will start on `http://localhost:5000`

## What Changed?

### Backend Restructuring

The monolithic `app.py` (1697 lines) has been split into:

1. **Configuration** (`backend/config.py`)
   - Centralized environment variables
   - Database, AWS, AI API configuration

2. **Database Layer** (`backend/models/database.py`)
   - Connection management
   - Query helper functions

3. **Services Layer** (`backend/services/`)
   - `ai_service.py` - AI processing
   - `pv_service.py` - PV workflow
   - `s3_service.py` - S3 operations
   - `rag_service.py` - RAG knowledge base

4. **Routes Layer** (`backend/routes/`)
   - `auth.py` - Login/logout
   - `volunteer.py` - PV volunteer operations
   - `admin.py` - Admin review & decisions
   - `analytics.py` - Analytics dashboard
   - `scholarship.py` - Scholarship management

### Benefits

✅ **Better Code Organization** - Each module has a single responsibility
✅ **Easier Maintenance** - Find and fix issues faster
✅ **Improved Readability** - Smaller, focused files
✅ **Scalability** - Easy to add new features
✅ **Team Collaboration** - Multiple developers can work on different modules

### Frontend

The frontend remains **unchanged** - all HTML templates work with the new backend structure.

## API Endpoints

### Authentication
- `GET /` - Login page
- `POST /` - Login submission
- `GET /logout` - Logout

### Volunteer (PV)
- `GET /students-assign` - Assigned students dashboard
- `GET /student/<id>` - Student details page
- `GET /pv/<id>` - PV form page
- `GET /api/assigned-students` - Get assigned students (API)
- `GET /api/student/<id>` - Get student details (API)
- `POST /temp-upload` - Temporary image upload
- `POST /batch-quality-check` - Batch quality check
- `POST /final-upload-batch` - Final batch upload
- `POST /submit-pv` - Submit PV form
- `GET /api/pv-status/<id>` - Get PV status

### Admin
- `GET /admin/assign` - Pending students dashboard
- `GET /admin/decision/<id>` - Student review page
- `GET /admin/approved-students` - Approved students list
- `POST /admin/final_status_update/<id>` - Update final decision
- `POST /admin/interview-decision/<id>` - Update interview status

### Analytics
- `GET /admin/analytics` - Analytics dashboard page
- `GET /api/analytics/overview` - Overview statistics
- `GET /api/analytics/ai-accuracy` - AI accuracy metrics
- `GET /api/analytics/ai-errors` - AI error breakdown
- `GET /api/analytics/gender-distribution` - Gender distribution
- `GET /api/analytics/rejected-distribution` - Rejected distribution
- `GET /api/analytics/department-stats` - Department statistics
- `GET /api/analytics/batch-stats` - Batch statistics
- `GET /api/analytics/yearly-trends` - Yearly trends

### Scholarship
- `GET /admin/scholarship/<id>` - Scholarship form
- `POST /admin/scholarship/<id>` - Save scholarship details

## Development Notes

### Old Files (Backup)
- `app_old.py` - Original monolithic application (backup)
- `gemini_1.py` - Now in `backend/services/ai_service.py`
- `pv_graph.py` - Now in `backend/services/pv_graph.py`
- `pv_process.py` - Now in `backend/services/pv_process.py`
- `rag_service.py` - Now in `backend/services/rag_service.py`

### Environment Variables
Make sure your `.env` file contains:
```
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=your_database
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
```

## Troubleshooting

### Import Errors
If you see import errors, make sure you're running from the project root directory:
```bash
cd e:\PROJECT\volunteer-comments-analysis
python app.py
```

### Database Connection Issues
Check your `.env` file and ensure MySQL is running.

### S3 Upload Issues
Verify AWS credentials are configured properly.

## Next Steps for Frontend Developer

The backend is now modular and ready for frontend updates. All existing HTML templates work without changes. Your friend can:

1. Keep using existing HTML/CSS/JS templates
2. Gradually modernize the UI
3. Add new features by creating new templates
4. Use the documented API endpoints

All routes and functionality remain the same from the frontend perspective!