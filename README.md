# Volunteer Comments Analysis

AI-powered full-stack platform for student verification, interview evaluation, and volunteer comment analysis.

## Achievement

This project won **1st place** at a hackathon and received a **cash prize of 30,000**.

## Overview

This system streamlines scholarship screening workflows by combining structured verification steps with AI-driven analysis.

- Physical Verification (PV) support for field volunteers
- Virtual Interview (VI) and Real Interview (RI) evaluation flows
- Unified sentiment analysis from volunteer comments and interview audio
- AI-assisted document/image checks and decision support

## Key Features

- Volunteer comment ingestion, cleaning, and sentiment analysis
- Audio transcription and behavioral signal extraction
- Retrieval-augmented insights using vector search (ChromaDB)
- Admin workflows for review, validation, and final selection

## Tech Stack

- Frontend: React
- Backend: Flask (Python)
- AI/ML: Gemini, Groq, LangGraph, ChromaDB
- Database: MySQL
- Storage: AWS S3

## Project Structure

- `app.py` - app entrypoint
- `backend/` - backend services and APIs
- `frontend/` - frontend application
- `templates/`, `static/` - server-rendered assets
- `database/` - database-related assets
- `uploads/` - uploaded files

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows: .\\venv\\Scripts\\Activate
# Linux/Mac: source venv/bin/activate
pip install -r ../requirements.txt
python app.py
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

## Notes

- Keep secrets in `.env` (do not commit them).
- Use `.env.example` as the template for environment setup.
