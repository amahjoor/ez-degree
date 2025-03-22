import sys
import os

# Add the project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Query
from typing import List, Optional
from database.db import get_session, Course, Subject
from logic.courseScraper import scrape_courses

app = FastAPI(title="GMU Course API")

@app.get("/")
async def root():
    return {"message": "Welcome to GMU Course API"}

@app.get("/courses/")
async def get_courses(
    subject: Optional[str] = None,
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """
    Get all courses with optional filtering:
    - subject: Filter by subject code (e.g., 'CS', 'MATH')
    - search: Search in course code, title, or description
    - skip: Number of records to skip (pagination)
    - limit: Number of records to return (pagination)
    """
    db = get_session()
    try:
        query = db.query(Course)
        
        # Apply subject filter if provided
        if subject:
            query = query.filter(Course.subject_id == subject.upper())
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (Course.course_code.ilike(search_term)) |
                (Course.title.ilike(search_term)) |
                (Course.description.ilike(search_term))
            )
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply pagination
        courses = query.offset(skip).limit(limit).all()
        
        # Convert to dictionary format
        course_list = [
            {
                "course_code": course.course_code,
                "title": course.title,
                "credits": course.credits,
                "description": course.description,
                "subject": course.subject_id
            }
            for course in courses
        ]
        
        return {
            "total": total_count,
            "courses": course_list
        }
        
    finally:
        db.close()

@app.get("/courses/{course_code}")
async def get_course(course_code: str):
    """
    Get detailed information about a specific course
    """
    db = get_session()
    try:
        # Clean up the course code: remove extra spaces and convert to uppercase
        course_code = " ".join(course_code.upper().split())
        
        course = db.query(Course).filter(
            (Course.course_code == course_code) |  # Try exact match
            (Course.course_code == course_code.replace(" ", "")) |  # Try without space
            (Course.course_code == f"{course_code[0:2]} {course_code[2:]}") # Try with space
        ).first()
        
        if not course:
            raise HTTPException(
                status_code=404, 
                detail=f"Course {course_code} not found"
            )
            
        return {
            "course_code": course.course_code,
            "title": course.title,
            "credits": course.credits,
            "description": course.description,
            "subject": course.subject_id
        }
        
    finally:
        db.close()

@app.get("/subjects/")
async def get_subjects():
    """
    Get list of all subjects
    """
    db = get_session()
    try:
        subjects = db.query(Subject).all()
        return [
            {
                "id": subject.id,
                "name": subject.name,
                "course_count": len(subject.courses)
            }
            for subject in subjects
        ]
    finally:
        db.close()

if __name__ == "__main__":
    # Scrape ACCT courses
    scrape_courses('ACCT')
