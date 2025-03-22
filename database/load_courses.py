import json
import os
import sys

# Add parent directory to path so we can import properly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from database.db import init_db, Subject, Course, get_session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import text

def load_courses():
    # Initialize database
    init_db()
    
    # Create database session
    db = get_session()
    
    try:
        # Get the absolute path to the JSON file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        json_path = os.path.join(os.path.dirname(current_dir), 'output', 'all_courses.json')
        
        # Load the combined JSON file
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        # Process each subject
        for subject_code, courses in data['subjects'].items():
            print(f"Processing {subject_code}...")
            
            # Check if subject already exists
            existing_subject = db.query(Subject).filter(Subject.id == subject_code).first()
            
            if not existing_subject:
                # Add subject if it doesn't exist
                subject = Subject(
                    id=subject_code,
                    name=subject_code
                )
                db.add(subject)
                try:
                    db.flush()
                except IntegrityError:
                    db.rollback()
                    print(f"Subject {subject_code} already exists, skipping creation.")
                    existing_subject = db.query(Subject).filter(Subject.id == subject_code).first()
            
            # Process courses for this subject
            for course_data in courses:
                course_code = course_data['Code']
                
                # Check if course already exists
                existing_course = db.query(Course).filter(Course.course_code == course_code).first()
                
                if existing_course:
                    # Update existing course
                    existing_course.title = course_data['Title']
                    existing_course.credits = course_data['Credits']
                    existing_course.description = course_data['Description']
                    existing_course.prerequisites = course_data.get('Prerequisites', None)
                    existing_course.corequisites = course_data.get('Corequisites', None)
                    existing_course.restrictions = course_data.get('Restrictions', None)
                    existing_course.notes = course_data.get('Notes', None)
                else:
                    # Add new course
                    course = Course(
                        subject_id=subject_code,
                        course_code=course_code,
                        title=course_data['Title'],
                        credits=course_data['Credits'],
                        description=course_data['Description'],
                        prerequisites=course_data.get('Prerequisites', None),
                        corequisites=course_data.get('Corequisites', None),
                        restrictions=course_data.get('Restrictions', None),
                        notes=course_data.get('Notes', None)
                    )
                    db.add(course)
            
            # Commit after each subject to avoid large transactions
            db.commit()
        
        print("Successfully loaded all courses into database!")
        
    except Exception as e:
        print(f"Error loading courses: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    load_courses()
