# iWannaGraduate
Building a project to help students at GMU graduate.

The development plan is to fine-tune working on GMU CS, then other engineering, then expand it out to all majors at GMU. Then at that point, maybe even further...

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

## Data Collection

### Course Scraper
The project includes a course scraper that collects course information from the GMU course catalog.

#### Running the Course Scraper
1. Ensure your virtual environment is activated
2. Run the course scraper:
   ```bash
   python scrapers/courseScraper/courseScraper.py
   ```
3. The scraper will prompt you with options:
   - Enter a number (e.g., "5") to scrape that many subjects
   - Enter "all" to scrape all subjects
   - Enter specific subject codes (e.g., "CS,MATH") to scrape only those subjects

#### Output
The course scraper generates the following files:
- Individual JSON files for each subject (e.g., `data/courses/cs_courses.json`)
- A combined file with all courses (`data/courses/all_courses.json`)
- HTML files for debugging purposes in `data/courses/html_files/`

This data is used by the application to provide course information, prerequisites, and help with degree planning.

## Project Structure
- `api/` - FastAPI backend
- `database/` - Database models and operations
- `frontend/` - Next.js frontend application
- `scrapers/` - Web scrapers for course and requirements data
- `data/` - Collected and processed data
  - `courses/` - Course information scraped from the GMU catalog
- `migrations/` - Database migration scripts


Test