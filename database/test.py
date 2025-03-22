from db import get_session, Subject, Course

def test_database():
    session = get_session()
    try:
        # Count total subjects
        subject_count = session.query(Subject).count()
        print(f"\nTotal subjects: {subject_count}")
        
        # Count total courses - modified to only count id
        course_count = session.query(Course.id).count()
        print(f"Total courses: {course_count}")
        
        # Sample query: Get first 5 CS courses - modified to select specific columns
        print("\nSample CS courses:")
        cs_courses = session.query(Course.course_code, Course.title, Course.credits)\
            .filter(Course.subject_id == 'CS')\
            .limit(5)\
            .all()
        for course in cs_courses:
            print(f"{course.course_code}: {course.title} ({course.credits} credits)")
            
    finally:
        session.close()

if __name__ == "__main__":
    test_database()