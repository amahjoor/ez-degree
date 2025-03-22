# iWannaGraduate
Building a project to help CS majors at GMU graduate.

The plan is to work on GMU CS, then expand it out to all majors at GMU. Then at that point, maybe even further...

## Project Overview
iWannaGraduate helps GMU students navigate their degree requirements, plan courses, and track progress toward graduation.

## Setup and Installation

### Prerequisites
- Python 3.8+ with pip
- Node.js and npm (for the frontend)
- Git

### Backend Setup
1. Clone the repository
   ```bash
   git clone https://github.com/amahjoor/iWannaGraduate.git
   cd iWannaGraduate
   ```

2. Create and activate a virtual environment
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. Install Python dependencies
   ```bash
   pip install fastapi uvicorn sqlalchemy alembic selenium beautifulsoup4
   ```

4. Install Node.js dependencies for the project
   ```bash
   npm install
   ```

### Running the Application

#### All-in-One Development Mode
To start both the API server and frontend together:
```bash
npm run dev
```

This will start:
- Backend API server at http://127.0.0.1:8000
- Frontend development server at http://localhost:3000 (or next available port)

#### Separately

To start the API server only:
```bash
npm run start:backend
```

To start the frontend only:
```bash
npm run start:frontend
```

### API Documentation
After starting the backend, you can access the API documentation at http://127.0.0.1:8000/docs

## Project Structure
- `api/` - FastAPI backend
- `database/` - Database models and operations
- `frontend/` - Next.js frontend application
- `scraper/` - Web scrapers for course and requirements data
- `logic/` - Business logic components
- `migrations/` - Database migration scripts


Test