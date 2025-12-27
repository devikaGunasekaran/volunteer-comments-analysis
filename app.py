"""
Main Flask Application
Initializes the Flask app and registers all blueprints
"""
from flask import Flask
from flask_cors import CORS
import os
from backend.config import Config
from backend.routes.auth import auth_bp
from backend.routes.volunteer import volunteer_bp
from backend.routes.admin import admin_bp
from backend.routes.analytics import analytics_bp, register_analytics_page
from backend.routes.scholarship import scholarship_bp

# Create Flask app
app = Flask(__name__, 
            template_folder='templates',
            static_folder='static')

# Configure app
app.secret_key = Config.SECRET_KEY

# Enable CORS for React frontend
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type"]
    }
})

# Ensure upload folder exists
os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)

# =====================================================
# REGISTER BLUEPRINTS
# =====================================================

# Authentication routes
app.register_blueprint(auth_bp)

# Volunteer routes
app.register_blueprint(volunteer_bp)

# Admin routes
app.register_blueprint(admin_bp)

# Analytics routes
app.register_blueprint(analytics_bp)

# Scholarship routes
app.register_blueprint(scholarship_bp)

# Register analytics page route (special case)
register_analytics_page(app)

# =====================================================
# ERROR HANDLERS
# =====================================================

@app.errorhandler(404)
def not_found(error):
    return "Page not found", 404


@app.errorhandler(500)
def internal_error(error):
    return "Internal server error", 500


# =====================================================
# RUN APPLICATION
# =====================================================

if __name__ == "__main__":
    print("=" * 60)
    print("🚀 Starting Volunteer Comments Analysis Application")
    print("=" * 60)
    print(f"📁 Upload folder: {Config.UPLOAD_FOLDER}")
    print(f"🗄️  Database: {Config.DB_NAME}")
    print(f"☁️  S3 Bucket: {Config.AWS_BUCKET}")
    print(f"🤖 RAG Enabled: {Config.RAG_ENABLED}")
    print("=" * 60)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
