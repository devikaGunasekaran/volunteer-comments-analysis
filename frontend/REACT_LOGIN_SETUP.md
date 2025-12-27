# React Login Page Setup Guide

## What Was Created

I've created a React login page that matches your existing HTML design:

### Files Created:
1. **`frontend/src/pages/auth/LoginPage.jsx`** - Login component
2. **`frontend/src/pages/auth/LoginPage.css`** - Styles
3. **`frontend/src/assets/`** - Images folder
   - `logo_icon.jpg`
   - `background_img.jpg`

### Updated Files:
1. **`frontend/src/App.js`** - Added routing
2. **`frontend/src/App.css`** - Global styles

---

## Installation Steps

### 1. Install React Router

```bash
cd frontend
npm install react-router-dom
```

### 2. Run the React App

```bash
npm start
```

The app will open at `http://localhost:3000` and show the login page!

---

## Features

✅ **Matches original design** - Same look and feel as HTML version
✅ **Form validation** - Required fields
✅ **API integration** - Calls `/api/login` endpoint
✅ **Error handling** - Shows error messages
✅ **Loading state** - Disables form during login
✅ **Role-based routing** - Redirects based on user role:
   - PV → `/students-assign`
   - Admin → `/admin/assign`
✅ **Responsive design** - Works on mobile and desktop

---

## How It Works

1. User enters Volunteer ID and Password
2. Form submits to `http://localhost:5000/api/login`
3. Backend returns user data and token
4. Token stored in localStorage
5. User redirected based on role

---

## Next Steps

### Backend Changes Needed:

Update `backend/routes/auth.py` to return JSON instead of rendering template:

```python
@auth_bp.route("/api/login", methods=["POST"])
def api_login():
    data = request.json
    volunteerId = data.get("volunteerId")
    password = data.get("password")
    
    # ... authentication logic ...
    
    if volunteer:
        return jsonify({
            "success": True,
            "user": {
                "volunteerId": volunteer['volunteerId'],
                "role": volunteer['role'],
                "name": volunteer.get('name')
            },
            "token": "jwt_token_here"  # Implement JWT
        })
    else:
        return jsonify({
            "success": False,
            "message": "Invalid credentials!"
        }), 401
```

### Add CORS to Backend:

```python
# backend/app.py
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow React to call API
```

---

## Testing

1. **Start Backend:**
   ```bash
   python app.py
   ```

2. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Test Login:**
   - Go to `http://localhost:3000`
   - Enter credentials
   - Check browser console for API calls

---

## File Structure

```
frontend/src/
├── pages/
│   └── auth/
│       ├── LoginPage.jsx
│       └── LoginPage.css
├── assets/
│   ├── logo_icon.jpg
│   └── background_img.jpg
├── App.js
└── App.css
```

---

Your React login page is ready! Install `react-router-dom` and run `npm start` to see it in action! 🎉
