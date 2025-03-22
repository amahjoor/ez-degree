import sys
import os
import json

# Add the project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from database.db import get_session, Course as DbCourse, Subject as DbSubject
from logic.courseScraper import scrape_courses

# Define models for API documentation
class Major(BaseModel):
    id: str = Field(..., description="Unique identifier for the major")
    name: str = Field(..., description="Display name of the major")
    
    class Config:
        schema_extra = {
            "example": {
                "id": "computer_science_bs",
                "name": "Computer Science BS"
            }
        }

class MajorList(BaseModel):
    majors: List[Major] = Field(..., description="List of available majors")

class CourseAlternative(BaseModel):
    alternative_code: str = Field(..., description="Course code for the alternative course")
    alternative_title: str = Field(..., description="Title of the alternative course")
    alternative_credits: float = Field(..., description="Number of credits for the alternative course")

class CourseModel(BaseModel):
    code: str = Field(..., description="Course code (e.g., CS 110)")
    title: str = Field(..., description="Course title")
    credits: float = Field(..., description="Number of credits for the course")
    alternatives: List[CourseAlternative] = Field(default=[], description="List of alternative courses that can fulfill this requirement")

class Category(BaseModel):
    name: str = Field(..., description="Category name (e.g., 'Computer Science Core')")
    total_credits: float = Field(..., description="Total credits required in this category")
    courses: List[CourseModel] = Field(..., description="List of courses in this category")

class Concentration(BaseModel):
    id: str = Field(..., description="Concentration ID (e.g., 'IAME', 'SWE')")
    name: str = Field(..., description="Concentration name (e.g., 'Intelligence Analysis and Middle Eastern Studies')")
    total_credits: float = Field(..., description="Total credits required for this concentration")
    categories: List[Category] = Field(..., description="List of requirement categories for this concentration")

class Requirements(BaseModel):
    degree_name: str = Field(..., description="Name of the degree program")
    total_credits: float = Field(..., description="Total credits required for the degree")
    categories: List[Category] = Field(..., description="List of requirement categories")
    concentrations: List[Concentration] = Field(default=[], description="List of available concentrations for this degree")

class ConcentrationInfo(BaseModel):
    id: str = Field(..., description="Concentration ID (e.g., 'SWE')")
    name: str = Field(..., description="Concentration name (e.g., 'Software Engineering')")

class ConcentrationList(BaseModel):
    concentrations: List[ConcentrationInfo] = Field(..., description="List of available concentrations for the major")

app = FastAPI(
    title="GMU Course API",
    description="API for GMU course information and degree requirements",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware to allow cross-origin requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],  # Allow requests from Next.js dev server
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Path to requirements directory
REQUIREMENTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
                               "majorReqScraper", "data")

# Make sure it exists
if not os.path.exists(REQUIREMENTS_DIR):
    # Try an alternate path for the data directory
    REQUIREMENTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
    print(f"Using alternate data directory: {REQUIREMENTS_DIR}")
    
    # Create it if it doesn't exist
    if not os.path.exists(REQUIREMENTS_DIR):
        os.makedirs(REQUIREMENTS_DIR, exist_ok=True)
        print(f"Created data directory: {REQUIREMENTS_DIR}")

# Helper function to load all majors
def get_available_majors():
    
    """Get a list of all available majors from the requirements directory"""
    majors = []
    # Look for json files that follow the pattern: xxx_requirements.json
    for filename in os.listdir(REQUIREMENTS_DIR):
        if filename.endswith("_requirements.json") and not filename.startswith("cs_requirements"):
            # Convert filename to major name
            major_id = filename.replace("_requirements.json", "")
            major_name = major_id.replace("_", " ").title()
            majors.append({
                "id": major_id,
                "name": major_name
            })
    return majors

# Helper function to load requirements for a specific major
def load_major_requirements(major_id: str):
    """Load requirements for a specific major from JSON file"""
    file_path = os.path.join(REQUIREMENTS_DIR, f"{major_id}_requirements.json")
    
    if not os.path.exists(file_path):
        return None
        
    with open(file_path, 'r') as f:
        return json.load(f)

@app.get("/")
async def root():
    """Welcome endpoint for the API"""
    return {"message": "Welcome to GMU Course API"}

@app.get("/requirements/majors", 
         response_model=MajorList,
         summary="Get available majors",
         description="Returns a list of all majors available in the system",
         response_description="A list of major objects with ID and name")
async def get_majors():
    """
    Get a list of all available majors
    
    Returns:
        A dictionary containing a list of major objects with their IDs and names
    
    Raises:
        HTTPException: If there's an error retrieving majors
    """
    try:
        majors = get_available_majors()
        return {"majors": majors}
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving majors: {str(e)}"
        )

@app.get("/requirements/majors/{major_id}", 
         response_model=Requirements,
         summary="Get major requirements",
         description="Returns detailed requirements for a specific major",
         response_description="Complete requirements data for the specified major")
async def get_major_requirements(
    major_id: str = Path(..., 
                       description="ID of the major to retrieve requirements for", 
                       example="computer_science_bs"),
    concentration_id: Optional[str] = Query(None,
                                         description="Optional ID of a specific concentration to retrieve")
):
    """
    Get requirements for a specific major
    
    Args:
        major_id: ID of the major (e.g., 'computer_science_bs')
        concentration_id: Optional concentration ID to filter by (e.g., 'SWE' for Software Engineering)
    
    Returns:
        Requirements object containing degree name, total credits, and categories with courses
        If concentration_id is provided, only returns requirements for that concentration
    
    Raises:
        HTTPException 404: If the major is not found
        HTTPException 404: If the concentration is not found
        HTTPException 500: If there's an error processing the request
    """
    try:
        # Clean up the major_id to avoid directory traversal
        major_id = major_id.lower().replace(" ", "_")
        major_id = ''.join(c for c in major_id if c.isalnum() or c == '_')
        
        requirements = load_major_requirements(major_id)
        
        if not requirements:
            raise HTTPException(
                status_code=404,
                detail=f"Requirements for major '{major_id}' not found"
            )
        
        # Transform the data to match expected format
        for category in requirements["categories"]:
            for course in category["courses"]:
                # Map 'id' to 'code' field
                if "id" in course and "code" not in course:
                    course["code"] = course["id"]
                    # Keep the id field too to avoid breaking anything else
        
        # Handle concentrations if present
        if "concentrations" in requirements and requirements["concentrations"]:
            # Transform concentration data to match expected format
            for concentration in requirements["concentrations"]:
                for category in concentration["categories"]:
                    for course in category["courses"]:
                        # Map 'id' to 'code' field
                        if "id" in course and "code" not in course:
                            course["code"] = course["id"]
                            # Keep the id field too to avoid breaking anything else
            
            # If concentration_id is provided, filter to show only that concentration
            if concentration_id:
                concentration_id = concentration_id.upper()  # Convert to uppercase for case-insensitive matching
                
                # Find the requested concentration
                matching_concentration = None
                for concentration in requirements["concentrations"]:
                    if concentration["id"].upper() == concentration_id:
                        matching_concentration = concentration
                        break
                
                if not matching_concentration:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Concentration '{concentration_id}' not found for major '{major_id}'"
                    )
                
                # Return a modified requirements object that includes only the requested concentration
                return {
                    "degree_name": f"{requirements['degree_name']} - {matching_concentration['name']}",
                    "total_credits": requirements["total_credits"],
                    "categories": requirements["categories"] + matching_concentration["categories"],
                    "concentrations": []  # Empty since we're already including the specific concentration
                }
        
        return requirements
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving requirements: {str(e)}"
        )

@app.get("/requirements/majors/{major_id}/concentrations", 
         response_model=ConcentrationList,
         summary="Get available concentrations for a major",
         description="Returns a list of all concentrations available for a specific major",
         response_description="A list of concentration objects with ID and name")
async def get_major_concentrations(
    major_id: str = Path(..., 
                       description="ID of the major to retrieve concentrations for", 
                       example="applied_computer_science_bs")
):
    """
    Get a list of all available concentrations for a specific major
    
    Args:
        major_id: ID of the major (e.g., 'applied_computer_science_bs')
    
    Returns:
        A dictionary containing a list of concentration objects with their IDs and names
    
    Raises:
        HTTPException 404: If the major is not found
        HTTPException 500: If there's an error processing the request
    """
    try:
        # Clean up the major_id to avoid directory traversal
        major_id = major_id.lower().replace(" ", "_")
        major_id = ''.join(c for c in major_id if c.isalnum() or c == '_')
        
        requirements = load_major_requirements(major_id)
        
        if not requirements:
            raise HTTPException(
                status_code=404,
                detail=f"Requirements for major '{major_id}' not found"
            )
        
        # Check if the major has concentrations
        if "concentrations" not in requirements or not requirements["concentrations"]:
            return {"concentrations": []}
        
        # Extract concentration information
        concentrations = []
        for concentration in requirements["concentrations"]:
            concentrations.append({
                "id": concentration["id"],
                "name": concentration["name"]
            })
        
        return {"concentrations": concentrations}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving concentrations: {str(e)}"
        )

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
        query = db.query(DbCourse)
        
        # Apply subject filter if provided
        if subject:
            query = query.filter(DbCourse.subject_id == subject.upper())
        
        # Apply search filter if provided
        if search:
            search_term = f"%{search}%"
            query = query.filter(
                (DbCourse.course_code.ilike(search_term)) |
                (DbCourse.title.ilike(search_term)) |
                (DbCourse.description.ilike(search_term))
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
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving courses: {str(e)}"
        )
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
        
        course = db.query(DbCourse).filter(
            (DbCourse.course_code == course_code) |  # Try exact match
            (DbCourse.course_code == course_code.replace(" ", "")) |  # Try without space
            (DbCourse.course_code == f"{course_code[0:2]} {course_code[2:]}") # Try with space
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
        subjects = db.query(DbSubject).all()
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
