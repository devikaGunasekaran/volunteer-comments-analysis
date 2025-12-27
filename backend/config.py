"""
Configuration module for the application
Centralizes all configuration settings from environment variables
"""
import os

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


class Config:
    """Application configuration"""
    
    # Flask settings
    SECRET_KEY = os.environ.get('SECRET_KEY', 'supersecretkey')
    
    # Database configuration
    DB_HOST = os.environ.get('DB_HOST')
    DB_USER = os.environ.get('DB_USER')
    DB_PASSWORD = os.environ.get('DB_PASSWORD')
    DB_NAME = os.environ.get('DB_NAME')
    
    # AWS S3 configuration
    AWS_BUCKET = "my-app-house-images-2025"
    AWS_REGION = "eu-north-1"
    
    # AI API Keys
    GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY')
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
    
    # RAG Configuration
    CHROMA_DB_PATH = os.environ.get('CHROMA_DB_PATH', './chroma_db')
    RAG_COLLECTION_NAME = os.environ.get('RAG_COLLECTION_NAME', 'student_cases')
    RAG_TOP_K = int(os.environ.get('RAG_TOP_K', '5'))
    RAG_ENABLED = os.environ.get('RAG_ENABLED', 'true').lower() == 'true'
    
    # Upload settings
    UPLOAD_FOLDER = 'uploads'
    MIN_IMAGES_REQUIRED = 1
    
    @staticmethod
    def get_db_config():
        """Get database configuration as dictionary"""
        return {
            'host': Config.DB_HOST,
            'user': Config.DB_USER,
            'password': Config.DB_PASSWORD,
            'database': Config.DB_NAME
        }
