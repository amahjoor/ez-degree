import json
import os
from db import init_db, Subject, Course, get_session

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
            
            # Add subject
            subject = Subject(
                id=subject_code,
                name=subject_code
            )
            db.add(subject)
            
            # Add courses for this subject
            for course_data in courses:
                course = Course(
                    subject_id=subject_code,
                    course_code=course_data['Code'],
                    title=course_data['Title'],
                    credits=course_data['Credits'],
                    description=course_data['Description']
                )
                db.add(course)
        
        # Commit changes
        db.commit()
        print("Successfully loaded all courses into database!")
        
    except Exception as e:
        print(f"Error loading courses: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    load_courses()
