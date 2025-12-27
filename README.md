# Volunteer Comments Analysis - Full Stack Application

## Architecture

This is a **full-stack application** with:
- **Backend**: Flask (Python) - RESTful API
- **Frontend**: React (JavaScript) - Single Page Application
- **Database**: MySQL
- **AI Services**: Google Gemini, Groq
- **Storage**: AWS S3

## Project Structure

```
volunteer-comments-analysis/
├── backend/                      # Flask Backend (API)
│   ├── __init__.py
│   ├── app.py                   # Main Flask app with blueprints
│   ├── config.py                # Centralized configuration
│   ├── routes/                  # API route handlers
│   │   ├── __init__.py
│   │   ├── auth.py             # Authentication endpoints
│   │   ├── volunteer.py        # PV volunteer endpoints
│   │   ├── admin.py            # Admin endpoints
│   │   ├── analytics.py        # Analytics API
│   │   └── scholarship.py      # Scholarship management
│   ├── services/                # Business logic
│   │   ├── __init__.py
│   │   ├── ai_service.py       # AI processing (Gemini/Groq)
│   │   ├── pv_graph.py         # LangGraph workflow
│   │   ├── pv_process.py       # PV processing
│   │   ├── rag_service.py      # RAG knowledge base
│   │   └── s3_service.py       # AWS S3 operations
│   ├── models/                  # Data layer
│   │   ├── __init__.py
│   │   └── database.py         # Database utilities
│   └── utils/                   # Helper functions
│       └── __init__.py
│
├── frontend/                     # React Frontend
│   ├── public/                  # Static files
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   ├── src/                     # React source code
│   │   ├── components/          # Reusable components (to be created)
│   │   │   ├── common/         # Shared components
│   │   │   ├── auth/           # Auth components
│   │   │   ├── volunteer/      # PV volunteer components
│   │   │   └── admin/          # Admin components
│   │   ├── pages/               # Page components (to be created)
│   │   │   ├── auth/           # Login page
│   │   │   ├── volunteer/      # PV pages
│   │   │   └── admin/          # Admin pages
│   │   ├── services/            # API calls (to be created)
│   │   │   ├── api.js          # Axios setup
│   │   │   ├── authService.js
│   │   │   ├── volunteerService.js
│   │   │   └── adminService.js
│   │   ├── hooks/               # Custom React hooks (to be created)
│   │   ├── context/             # React Context (to be created)
│   │   ├── App.js               # Main app component
│   │   ├── App.css
│   │   ├── index.js             # Entry point
│   │   └── index.css
│   ├── package.json             # Frontend dependencies
│   ├── package-lock.json
│   └── .gitignore
│
├── templates/                    # OLD: HTML templates (legacy)
├── static/                       # OLD: Static files (legacy)
├── uploads/                      # Temporary uploads
├── venv/                         # Python virtual environment
├── app.py                        # Main entry point
├── requirements.txt              # Python dependencies
├── .env                          # Environment variables
├── .gitignore
└── README.md
```

## Quick Start

### Backend Setup (Flask API)

**1. Create Python Virtual Environment**
```powershell
# Windows
py -3.11 -m venv venv
.\venv\Scripts\Activate.ps1

# Linux/Mac
python3.11 -m venv venv
source venv/bin/activate
```

**2. Install Python Dependencies**
```bash
pip install -r requirements.txt
```

**3. Configure Environment Variables**

Create a `.env` file:
```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=volunteer_comments_db

GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key

RAG_ENABLED=true
```

**4. Run Backend Server**
```bash
python app.py
```
Backend runs on `http://localhost:5000`

---

### Frontend Setup (React)

**1. Install Node.js Dependencies**
```bash
cd frontend
npm install
```

**2. Run React Development Server**
```bash
npm start
```
Frontend runs on `http://localhost:3000`

---

### Development Workflow

**Terminal 1 - Backend:**
```bash
.\venv\Scripts\Activate.ps1  # Activate Python venv
python app.py                 # Run Flask API
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start                     # Run React app
```

## Technology Stack

### Backend
- **Framework**: Flask 3.0.0
- **Language**: Python 3.11
- **Database**: MySQL 8.0
- **ORM**: mysql-connector-python
- **AI/ML**: 
  - Google Gemini API (text/image analysis)
  - Groq API (audio transcription)
  - LangGraph (workflow orchestration)
  - ChromaDB (vector database for RAG)
  - Sentence Transformers (embeddings)
- **Storage**: AWS S3 (boto3)
- **Environment**: python-dotenv

### Frontend
- **Framework**: React 18
- **Language**: JavaScript (ES6+)
- **Build Tool**: Create React App
- **HTTP Client**: Axios (to be installed)
- **Routing**: React Router (to be installed)
- **UI Library**: Material-UI or Ant Design (optional)

---

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