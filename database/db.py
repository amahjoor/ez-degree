from sqlalchemy import create_engine, Column, String, Integer, Text, ForeignKey, Float, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime

# Create database engine
DATABASE_URL = "postgresql://localhost/gmu_courses"
engine = create_engine(DATABASE_URL)

# Create declarative base
Base = declarative_base()

# Define models
class Subject(Base):
    __tablename__ = 'subjects'
    
    id = Column(String(10), primary_key=True)
    name = Column(String(100), nullable=False)
    courses = relationship("Course", back_populates="subject")

class Course(Base):
    __tablename__ = 'courses'
    
    id = Column(Integer, primary_key=True)
    subject_id = Column(String(10), ForeignKey('subjects.id'), nullable=False)
    course_code = Column(String(20), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    credits = Column(String(10), nullable=False)
    description = Column(Text)
    
    # New fields
    prerequisites = Column(Text)
    corequisites = Column(Text)
    restrictions = Column(Text)
    notes = Column(Text)
    
    # Rating fields
    overall_rating = Column(Float, nullable=True)
    overall_difficulty = Column(Float, nullable=True)
    
    subject = relationship("Subject", back_populates="courses")
    reviews = relationship("Review", back_populates="course")

class Review(Base):
    __tablename__ = 'reviews'
    
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    professor_name = Column(String(200), nullable=False)
    professor_department = Column(String(100))
    comment = Column(Text)
    date = Column(DateTime, default=datetime.utcnow)
    difficulty_rating = Column(Float, nullable=False)
    clarity_rating = Column(Float)
    helpful_rating = Column(Float)
    grade = Column(String(10))
    textbook_use = Column(String(50))
    would_take_again = Column(Boolean)
    attendance_mandatory = Column(String(50))
    is_for_credit = Column(Boolean)
    is_for_online_class = Column(Boolean)
    rating_tags = Column(Text)  # Store as JSON string
    thumbs_down_total = Column(Integer)
    thumbs_up_total = Column(Integer)
    
    course = relationship("Course", back_populates="reviews")

# Create Session class
Session = sessionmaker(bind=engine)

# Create session factory
def get_session():
    return Session()

# Initialize database
def init_db():
    Base.metadata.create_all(engine)

# Export all needed components
__all__ = ['Session', 'init_db', 'Subject', 'Course', 'get_session']
