import sys
import os
import json

# Add the project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Query, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field, validator
from database.db import get_session, Course as DbCourse, Subject as DbSubject
from scrapers.courseScraper.courseScraper import scrape_courses

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

class CourseReview(BaseModel):
    """Model for a course review with professor information"""
    professor_name: str = Field(..., description="Full name of the professor")
    professor_department: str = Field(..., description="Department of the professor")
    comment: str = Field(..., description="Review comment")
    date: str = Field(..., description="Review date")
    difficulty_rating: float = Field(..., description="Difficulty rating (1-5)")
    clarity_rating: Optional[float] = Field(None, description="Clarity rating (1-5)")
    helpful_rating: Optional[float] = Field(None, description="Helpfulness rating (1-5)")
    grade: str = Field("", description="Grade received")
    textbook_use: Optional[str] = Field(None, description="Textbook use (Yes/No/N/A or numeric rating)")
    would_take_again: Optional[bool] = Field(None, description="Would take again")
    attendance_mandatory: Optional[str] = Field(None, description="Attendance requirement")
    is_for_credit: Optional[bool] = Field(None, description="If the review is for credit")
    is_for_online_class: Optional[bool] = Field(None, description="If the review is for an online class")
    rating_tags: Optional[List[str]] = Field(None, description="Rating tags")
    thumbs_down_total: Optional[int] = Field(None, description="Number of thumbs down")
    thumbs_up_total: Optional[int] = Field(None, description="Number of thumbs up")

class PaginatedReviews(BaseModel):
    """Model for paginated review response"""
    total: int = Field(..., description="Total number of reviews")
    page: int = Field(..., description="Current page number")
    total_pages: int = Field(..., description="Total number of pages")
    reviews: List[CourseReview] = Field(..., description="List of reviews for the current page")

class Professor(BaseModel):
    firstName: str = Field(..., description="Professor's first name")
    lastName: str = Field(..., description="Professor's last name")
    department: str = Field(..., description="Professor's department")
    avgRating: float = Field(..., description="Average rating (1-5)")
    avgDifficulty: float = Field(..., description="Average difficulty (1-5)")
    wouldTakeAgainPercent: float = Field(..., description="Percentage of students who would take again")
    helpfulRating: Optional[float] = Field(None, description="Average helpfulness rating (1-5)")
    clarityRating: Optional[float] = Field(None, description="Average clarity rating (1-5)")
    averageGrade: Optional[str] = Field(None, description="Average grade given")
    reviews: Dict[str, List[CourseReview]] = Field(..., description="Reviews by course code")
    url: Optional[str] = Field(None, description="URL to professor's profile")
    isAttendanceMandatory: Optional[float] = Field(None, description="Attendance mandatory percentage")

class ProfessorList(BaseModel):
    professors: List[Professor] = Field(..., description="List of professors")
    total: int = Field(..., description="Total number of professors matching the filters")

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
REQUIREMENTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

# Make sure it exists
if not os.path.exists(REQUIREMENTS_DIR):
    print(f"Using data directory: {REQUIREMENTS_DIR}")
    
    # Create it if it doesn't exist
    os.makedirs(REQUIREMENTS_DIR, exist_ok=True)
    print(f"Created data directory: {REQUIREMENTS_DIR}")

# Helper function to load all majors
def get_available_majors():
    # Check for all_programs.json in the data/majors folder
    majors_dir = os.path.join(REQUIREMENTS_DIR, "majors")
    all_programs_path = os.path.join(majors_dir, "all_programs.json")
    
    if os.path.exists(all_programs_path):
        with open(all_programs_path, 'r') as f:
            return json.load(f)
    else:
        # Fall back to checking in the data folder for backward compatibility
        all_programs_path = os.path.join(REQUIREMENTS_DIR, "all_programs.json")
        if os.path.exists(all_programs_path):
            with open(all_programs_path, 'r') as f:
                return json.load(f)
        return []

# Helper function to load major requirements
def load_major_requirements(major_id):
    """
    Load major requirements from the JSON file.
    
    Args:
        major_id (str): The ID of the major
    
    Returns:
        dict: The requirements data
    """
    major_requirements_dir = os.path.join(REQUIREMENTS_DIR, "majorRequirements")
    if not os.path.exists(major_requirements_dir):
        os.makedirs(major_requirements_dir, exist_ok=True)
        
    req_file = os.path.join(major_requirements_dir, f"{major_id}_requirements.json")
    
    try:
        if os.path.exists(req_file):
            with open(req_file, 'r') as f:
                return json.load(f)
        else:
            # Try fallback filenames
            fallback_files = [
                os.path.join(major_requirements_dir, f"{major_id.replace('_', '-')}_requirements.json"),
                os.path.join(major_requirements_dir, f"{major_id}_bs_requirements.json")
            ]
            
            for file in fallback_files:
                if os.path.exists(file):
                    with open(file, 'r') as f:
                        return json.load(f)
                        
            # If we get here, no file was found
            return None
    except Exception as e:
        print(f"Error loading major requirements: {e}")
        return None

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
    subject: Optional[List[str]] = Query(None, description="Filter by subject code(s) (e.g., 'CS', 'MATH')"),
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """
    Get all courses with optional filtering:
    - subject: Filter by one or more subject codes (e.g., 'CS', 'MATH')
    - search: Search in course code, title, or description
    - skip: Number of records to skip (pagination)
    - limit: Number of records to return (pagination)
    
    Results are sorted by subject and then by course number.
    """
    db = get_session()
    try:
        query = db.query(DbCourse)
        
        # Apply subject filter if provided
        if subject:
            if len(subject) == 1:
                # Single subject filter
                query = query.filter(DbCourse.subject_id == subject[0].upper())
            else:
                # Multiple subject filter using OR condition
                from sqlalchemy import or_
                subject_filters = [DbCourse.subject_id == s.upper() for s in subject]
                query = query.filter(or_(*subject_filters))
        
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
        
        # Apply ordering by subject_id and then by numeric part of course code
        # We use a SQL function to extract the numeric part from course_code for sorting
        from sqlalchemy.sql import text
        query = query.order_by(
            DbCourse.subject_id,
            text("CAST(REGEXP_REPLACE(course_code, '[^0-9]', '', 'g') AS INTEGER)")
        )
        
        # Apply pagination
        courses = query.offset(skip).limit(limit).all()
        
        # Convert to dictionary format
        course_list = [
            {
                "course_code": course.course_code,
                "title": course.title,
                "credits": course.credits,
                "description": course.description,
                "subject": course.subject_id,
                "prerequisites": course.prerequisites,
                "corequisites": course.corequisites,
                "restrictions": course.restrictions,
                "notes": course.notes
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
    Get detailed information about a specific course, including professor ratings and reviews
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

        # Get professor information for this course
        professors_dir = os.path.join(REQUIREMENTS_DIR, "professors")
        course_professors = []
        
        if os.path.exists(professors_dir):
            for filename in os.listdir(professors_dir):
                try:
                    with open(os.path.join(professors_dir, filename), 'r') as f:
                        professor_data = json.load(f)
                        # Try different course code formats
                        course_code_variants = [
                            course_code,  # Original format (e.g., "ENG 302")
                            course_code.replace(" ", ""),  # No space (e.g., "ENG302")
                            course_code.replace(" ", "")[:3] + course_code.replace(" ", "")[3:],  # With space after subject (e.g., "ENG 302")
                            course_code[:2] + course_code[2:].replace(" ", ""),  # Subject without space (e.g., "ENGL302")
                        ]
                        
                        for variant in course_code_variants:
                            if variant in professor_data.get('reviews', {}):
                                # Calculate course-specific metrics
                                reviews = professor_data['reviews'][variant]
                                avg_rating = sum(review.get('difficultyRating', 0) for review in reviews) / len(reviews)
                                avg_difficulty = sum(review.get('difficultyRating', 0) for review in reviews) / len(reviews)
                                would_take_again = sum(1 for review in reviews if review.get('wouldTakeAgain', False)) / len(reviews) * 100
                                avg_clarity = sum(review.get('clarityRating', 0) for review in reviews) / len(reviews) if all('clarityRating' in review for review in reviews) else None
                                avg_helpful = sum(review.get('helpfulRating', 0) for review in reviews) / len(reviews) if all('helpfulRating' in review for review in reviews) else None
                                avg_grade = max(set(review.get('grade', '') for review in reviews), key=lambda x: reviews.count(x)) if reviews else None
                                
                                course_professors.append({
                                    "firstName": professor_data['firstName'],
                                    "lastName": professor_data['lastName'],
                                    "department": professor_data['department'],
                                    "avgRating": avg_rating,
                                    "avgDifficulty": avg_difficulty,
                                    "wouldTakeAgainPercent": would_take_again,
                                    "clarityRating": avg_clarity,
                                    "helpfulRating": avg_helpful,
                                    "averageGrade": avg_grade,
                                    "reviews": reviews,
                                    "url": professor_data.get('url')
                                })
                                break  # Found a match, no need to try other variants
                except Exception as e:
                    print(f"Error processing professor file {filename}: {e}")
                    continue
            
            # Calculate overall course difficulty
            if course_professors:
                total_difficulty = sum(prof['avgDifficulty'] for prof in course_professors)
                overall_difficulty = total_difficulty / len(course_professors)
                
                # Calculate overall average grade
                all_grades = []
                for prof in course_professors:
                    for review in prof['reviews']:
                        if review.get('grade'):
                            all_grades.append(review['grade'])
                
                if all_grades:
                    # Convert letter grades to numbers for averaging
                    grade_values = {
                        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
                        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
                        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
                        'D+': 1.3, 'D': 1.0, 'D-': 0.7,
                        'F': 0.0
                    }
                    
                    # Calculate average numeric grade
                    numeric_grades = [grade_values.get(grade, 0) for grade in all_grades]
                    avg_numeric = sum(numeric_grades) / len(numeric_grades)
                    
                    # Convert back to letter grade
                    if avg_numeric >= 3.85:
                        overall_grade = 'A'
                    elif avg_numeric >= 3.5:
                        overall_grade = 'A-'
                    elif avg_numeric >= 3.15:
                        overall_grade = 'B+'
                    elif avg_numeric >= 2.85:
                        overall_grade = 'B'
                    elif avg_numeric >= 2.5:
                        overall_grade = 'B-'
                    elif avg_numeric >= 2.15:
                        overall_grade = 'C+'
                    elif avg_numeric >= 1.85:
                        overall_grade = 'C'
                    elif avg_numeric >= 1.5:
                        overall_grade = 'C-'
                    elif avg_numeric >= 1.15:
                        overall_grade = 'D+'
                    elif avg_numeric >= 0.85:
                        overall_grade = 'D'
                    elif avg_numeric >= 0.5:
                        overall_grade = 'D-'
                    else:
                        overall_grade = 'F'
                else:
                    overall_grade = None
            else:
                overall_difficulty = None
                overall_grade = None
            
        return {
            "course_code": course.course_code,
            "title": course.title,
            "credits": course.credits,
            "description": course.description,
            "subject": course.subject_id,
            "prerequisites": course.prerequisites,
            "corequisites": course.corequisites,
            "restrictions": course.restrictions,
            "notes": course.notes,
            "overall_difficulty": overall_difficulty,
            "overall_grade": overall_grade,
            "professors": course_professors
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

@app.get("/professors/", 
         response_model=ProfessorList,
         summary="Get professor information",
         description="Returns information about professors, optionally filtered by department or course",
         response_description="A list of professor objects with their ratings and reviews")
async def get_professors(
    department: Optional[str] = Query(None, description="Filter by department"),
    course_code: Optional[str] = Query(None, description="Filter by course code"),
    min_rating: Optional[float] = Query(None, description="Minimum average rating (1-5)"),
    max_difficulty: Optional[float] = Query(None, description="Maximum difficulty rating (1-5)"),
    search: Optional[str] = Query(None, description="Search by professor name or department"),
    skip: int = Query(0, description="Number of records to skip (pagination)"),
    limit: int = Query(10, description="Number of records to return (pagination)")
):
    """
    Get information about professors with optional filtering and pagination
    
    Args:
        department: Optional department to filter by
        course_code: Optional course code to filter by
        min_rating: Optional minimum average rating
        max_difficulty: Optional maximum difficulty rating
        search: Optional search term for professor name or department
        skip: Number of records to skip (pagination)
        limit: Number of records to return (pagination)
    
    Returns:
        A list of professor objects with their ratings and reviews
    
    Raises:
        HTTPException: If there's an error retrieving professor data
    """
    try:
        professors_dir = os.path.join(REQUIREMENTS_DIR, "professors")
        if not os.path.exists(professors_dir):
            raise HTTPException(
                status_code=404,
                detail="Professor data not found"
            )
        
        professors = []
        for filename in os.listdir(professors_dir):
            try:
                with open(os.path.join(professors_dir, filename), 'r') as f:
                    professor_data = json.load(f)
                    
                    # Apply filters
                    if department and professor_data.get('department') != department:
                        continue
                        
                    if course_code and course_code not in professor_data.get('reviews', {}):
                        continue
                        
                    if min_rating and professor_data.get('avgRating', 0) < min_rating:
                        continue
                        
                    if max_difficulty and professor_data.get('avgDifficulty', 5) > max_difficulty:
                        continue

                    # Apply search filter
                    if search:
                        search_term = search.lower()
                        full_name = f"{professor_data.get('firstName', '')} {professor_data.get('lastName', '')}".lower()
                        dept = professor_data.get('department', '').lower()
                        if not (search_term in full_name or search_term in dept):
                            continue
                    
                    professors.append(professor_data)
            except json.JSONDecodeError as e:
                print(f"Error decoding JSON for file {filename}: {e}")
                continue
            except Exception as e:
                print(f"Error processing file {filename}: {e}")
                continue
        
        # Apply pagination
        total_count = len(professors)
        paginated_professors = professors[skip:skip + limit]
        
        return {
            "professors": paginated_professors,
            "total": total_count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving professor data: {str(e)}"
        )

@app.get("/professors/{professor_id}", 
         response_model=Professor,
         summary="Get specific professor information",
         description="Returns detailed information about a specific professor",
         response_description="Complete professor data including ratings and reviews")
async def get_professor(
    professor_id: str = Path(..., description="ID of the professor to retrieve")
):
    """
    Get information about a specific professor
    
    Args:
        professor_id: ID of the professor to retrieve
    
    Returns:
        Professor object with complete information including ratings and reviews
    
    Raises:
        HTTPException 404: If the professor is not found
        HTTPException 500: If there's an error processing the request
    """
    try:
        professor_file = os.path.join(REQUIREMENTS_DIR, "professors", professor_id)
        if not os.path.exists(professor_file):
            raise HTTPException(
                status_code=404,
                detail=f"Professor with ID '{professor_id}' not found"
            )
            
        with open(professor_file, 'r') as f:
            professor_data = json.load(f)
            
        return professor_data
        
    except json.JSONDecodeError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error decoding professor data: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving professor data: {str(e)}"
        )

@app.get("/api/courses/{course_code}/reviews", response_model=PaginatedReviews)
async def get_course_reviews(
    course_code: str = Path(..., description="Course code (e.g., CS 110)"),
    page: int = Query(1, description="Page number for pagination"),
    limit: int = Query(10, description="Number of reviews per page"),
    professor: Optional[str] = Query(None, description="Filter reviews by professor name")
):
    """
    Get paginated reviews for a specific course.
    Optionally filter by professor name.
    """
    # Load professor data
    professors_data = []
    professors_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'professors')
    
    for filename in os.listdir(professors_dir):
        if filename.endswith('.json'):
            with open(os.path.join(professors_dir, filename), 'r') as f:
                professor_data = json.load(f)
                professors_data.append(Professor(**professor_data))
    
    # Collect all reviews for the course
    all_reviews = []
    for prof in professors_data:
        if course_code in prof.reviews:
            for review in prof.reviews[course_code]:
                # Convert review to CourseReview format
                course_review = CourseReview(
                    professor_name=f"{prof.firstName} {prof.lastName}",
                    professor_department=prof.department,
                    comment=review.comment,
                    date=review.date,
                    difficulty_rating=review.difficultyRating,
                    clarity_rating=review.clarityRating,
                    helpful_rating=review.helpfulRating,
                    grade=review.grade,
                    textbook_use=review.textbookUse,
                    would_take_again=review.wouldTakeAgain,
                    attendance_mandatory=review.attendanceMandatory,
                    is_for_credit=review.isForCredit,
                    is_for_online_class=review.isForOnlineClass,
                    rating_tags=review.ratingTags,
                    thumbs_down_total=review.thumbsDownTotal,
                    thumbs_up_total=review.thumbsUpTotal
                )
                all_reviews.append(course_review)
    
    # Filter by professor if specified
    if professor:
        all_reviews = [r for r in all_reviews if professor.lower() in r.professor_name.lower()]
    
    # Sort reviews by date (newest first)
    all_reviews.sort(key=lambda x: x.date, reverse=True)
    
    # Calculate pagination
    total_reviews = len(all_reviews)
    total_pages = (total_reviews + limit - 1) // limit
    start_idx = (page - 1) * limit
    end_idx = min(start_idx + limit, total_reviews)
    
    # Get reviews for current page
    page_reviews = all_reviews[start_idx:end_idx]
    
    return PaginatedReviews(
        total=total_reviews,
        page=page,
        total_pages=total_pages,
        reviews=page_reviews
    )

@app.get("/api/courses/{course_code}/reviews/summary")
async def get_course_reviews_summary(
    course_code: str = Path(..., description="Course code (e.g., CS 110)")
):
    """
    Get a summary of reviews for a specific course, including:
    - Average ratings
    - Total number of reviews
    - Distribution of grades
    - Most common tags
    """
    # Load professor data
    professors_data = []
    professors_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'professors')
    
    for filename in os.listdir(professors_dir):
        if filename.endswith('.json'):
            with open(os.path.join(professors_dir, filename), 'r') as f:
                professor_data = json.load(f)
                professors_data.append(Professor(**professor_data))
    
    # Collect all reviews for the course
    all_reviews = []
    for prof in professors_data:
        if course_code in prof.reviews:
            all_reviews.extend(prof.reviews[course_code])
    
    if not all_reviews:
        raise HTTPException(status_code=404, detail="No reviews found for this course")
    
    # Calculate summary statistics
    total_reviews = len(all_reviews)
    
    # Calculate average ratings
    avg_difficulty = sum(r.difficultyRating for r in all_reviews) / total_reviews
    avg_clarity = sum(r.clarityRating for r in all_reviews if r.clarityRating) / len([r for r in all_reviews if r.clarityRating])
    avg_helpful = sum(r.helpfulRating for r in all_reviews if r.helpfulRating) / len([r for r in all_reviews if r.helpfulRating])
    
    # Calculate grade distribution
    grade_distribution = {}
    for review in all_reviews:
        grade = review.grade
        grade_distribution[grade] = grade_distribution.get(grade, 0) + 1
    
    # Calculate most common tags
    tag_counts = {}
    for review in all_reviews:
        if review.ratingTags:
            for tag in review.ratingTags:
                tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    # Sort tags by frequency
    sorted_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)
    top_tags = [tag for tag, _ in sorted_tags[:5]]  # Get top 5 tags
    
    return {
        "total_reviews": total_reviews,
        "average_ratings": {
            "difficulty": round(avg_difficulty, 2),
            "clarity": round(avg_clarity, 2),
            "helpful": round(avg_helpful, 2)
        },
        "grade_distribution": grade_distribution,
        "top_tags": top_tags
    }

if __name__ == "__main__":
    # Scrape ACCT courses
    scrape_courses('ACCT')
