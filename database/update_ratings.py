import sys
import os
import json
from collections import defaultdict
from typing import Dict, List, Tuple

# Add the project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import get_session, Course, Subject
from api.main import Professor, Review

def calculate_course_ratings(professors: List[Professor]) -> Dict[str, Tuple[float, float]]:
    """Calculate overall rating and difficulty for each course based on professor ratings."""
    course_ratings = defaultdict(lambda: {'total_rating': 0, 'total_difficulty': 0, 'count': 0})
    
    for professor in professors:
        for course_code, reviews in professor.reviews.items():
            if not reviews:
                continue
                
            # Calculate average rating and difficulty for this professor's reviews of this course
            avg_rating = sum(review.difficultyRating for review in reviews) / len(reviews)
            avg_difficulty = sum(review.difficultyRating for review in reviews) / len(reviews)
            
            course_ratings[course_code]['total_rating'] += avg_rating
            course_ratings[course_code]['total_difficulty'] += avg_difficulty
            course_ratings[course_code]['count'] += 1
    
    # Calculate final averages for each course
    final_ratings = {}
    for course_code, data in course_ratings.items():
        if data['count'] > 0:
            final_ratings[course_code] = (
                data['total_rating'] / data['count'],
                data['total_difficulty'] / data['count']
            )
    
    return final_ratings

def update_database_ratings():
    """Update course ratings in the database."""
    # Load professor data
    professors_data = []
    professors_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'professors')
    
    for filename in os.listdir(professors_dir):
        if filename.endswith('.json'):
            with open(os.path.join(professors_dir, filename), 'r') as f:
                professor_data = json.load(f)
                professors_data.append(Professor(**professor_data))
    
    # Calculate ratings
    course_ratings = calculate_course_ratings(professors_data)
    
    # Update database
    session = get_session()
    try:
        for course_code, (rating, difficulty) in course_ratings.items():
            course = session.query(Course).filter(Course.course_code == course_code).first()
            if course:
                course.overall_rating = rating
                course.overall_difficulty = difficulty
                print(f"Updated ratings for {course_code}: rating={rating:.2f}, difficulty={difficulty:.2f}")
        
        session.commit()
        print("Successfully updated all course ratings in database")
    except Exception as e:
        session.rollback()
        print(f"Error updating ratings: {e}")
    finally:
        session.close()

def update_course_files():
    """Update course JSON files with ratings from database."""
    session = get_session()
    try:
        # Get all courses with their ratings
        courses = session.query(Course).all()
        
        # Load existing course data
        courses_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'courses')
        all_courses_file = os.path.join(courses_dir, 'all_courses.json')
        
        with open(all_courses_file, 'r') as f:
            course_data = json.load(f)
        
        # Create a mapping of course codes to ratings
        ratings_map = {course.course_code: (course.overall_rating, course.overall_difficulty) 
                      for course in courses}
        
        # Update ratings in the course data
        for subject_code, subject_courses in course_data['subjects'].items():
            for course in subject_courses:
                course_code = course['Code']
                if course_code in ratings_map:
                    rating, difficulty = ratings_map[course_code]
                    course['OverallRating'] = rating
                    course['OverallDifficulty'] = difficulty
        
        # Save updated data
        with open(all_courses_file, 'w') as f:
            json.dump(course_data, f, indent=2)
        
        print("Successfully updated course files with ratings")
    except Exception as e:
        print(f"Error updating course files: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    print("Updating course ratings in database...")
    update_database_ratings()
    
    print("\nUpdating course files with ratings...")
    update_course_files() 