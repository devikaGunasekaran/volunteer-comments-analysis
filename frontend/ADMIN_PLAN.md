# React Admin Pages Implementation Plan

## Goal
Convert existing Admin functionality (`admin_assign.html`, `admin_view.html`) to React pages.

## Components
1. **AdminAssignPage.jsx**
   - **Route**: `/admin/assign` (or `/admin/dashboard`)
   - **Features**: 
     - Authentication check (Admin role)
     - List of verified students
     - Status badges
     - Accordion for quick view
     - Auto-refresh mechanism
   - **API needed**: 
     - `/api/admin/pending-students` (Already exists or needs verification in backend)

2. **AdminViewPage.jsx**
   - **Route**: `/admin/decision/:studentId`
   - **Features**:
     - Detailed student info
     - PV Report summary
     - Sentiment Analysis display
     - Audio Player
     - Image Gallery with AI analysis
     - Final Decision Form
   - **API needed**:
     - `GET /api/admin/student/:id` (Need to verify/create this endpoint)
     - `POST /api/admin/final-decision/:id`

## Backend Changes Required
- Need to check `admin.py` routes to ensure they return JSON instead of rendering templates.
- Currently `admin.admin_dashboard` renders `admin_assign.html`
- Currently `admin.admin_decision` renders `admin_view.html`

We will need new API endpoints or modify existing ones to return JSON if requested via API.

## Plan
1. **Create Backend API Endpoints** in `backend/routes/admin.py`
   - `GET /api/admin/students` (JSON version of dashboard)
   - `GET /api/admin/student/<id>` (JSON version of decision view)
   - `POST /api/admin/decision/<id>` (JSON version of status update)

2. **Create React Pages**
   - `frontend/src/pages/admin/AdminAssignPage.jsx`
   - `frontend/src/pages/admin/AdminViewPage.jsx`

3. **Routing**
   - Update `App.js` with admin routes
   - Update `authService` to handle admin role if needed
