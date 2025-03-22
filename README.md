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

### Running the Backend
To start the API server:
```bash
uvicorn api.main:app --reload
```

The API will be available at http://127.0.0.1:8000

You can access the API documentation at http://127.0.0.1:8000/docs

### Running the Frontend
The frontend is a Next.js application located in the `graduate` directory:

```bash
cd graduate
npm install  # Install dependencies
npm run dev  # Start the development server
```

The frontend will be available at http://localhost:3000

## Project Structure
- `api/` - FastAPI backend
- `database/` - Database models and operations
- `graduate/` - Next.js frontend application
- `scraper/` - Web scrapers for course and requirements data
- `logic/` - Business logic components
- `migrations/` - Database migration scripts
