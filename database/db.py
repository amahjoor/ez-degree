from sqlalchemy import create_engine, Column, String, Integer, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship

# Create database engine
DATABASE_URL = "postgresql://patriotassist:patriotassistftw@134.209.41.82:5432/patriotassistdb"
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
    
    subject = relationship("Subject", back_populates="courses")

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
