from sqlalchemy import create_engine, Column, String, Integer, Text, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from database.db import Base

# Define models for major requirements
class DegreeProgram(Base):
    __tablename__ = 'degree_programs'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    total_credits = Column(Float, nullable=False)
    description = Column(Text)
    categories = relationship("RequirementCategory", back_populates="degree")

class RequirementCategory(Base):
    __tablename__ = 'requirement_categories'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(200), nullable=False)
    degree_id = Column(Integer, ForeignKey('degree_programs.id'), nullable=False)
    total_credits = Column(Float, nullable=False)
    degree = relationship("DegreeProgram", back_populates="categories")
    courses = relationship("RequirementCourse", back_populates="category")

class RequirementCourse(Base):
    __tablename__ = 'requirement_courses'
    
    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey('requirement_categories.id'), nullable=False)
    code = Column(String(20), nullable=False)
    title = Column(String(200), nullable=False)
    credits = Column(Float, nullable=False)
    category = relationship("RequirementCategory", back_populates="courses")
    alternatives = relationship("CourseAlternative", back_populates="course")

class CourseAlternative(Base):
    __tablename__ = 'course_alternatives'
    
    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey('requirement_courses.id'), nullable=False)
    alternative_code = Column(String(20), nullable=False)
    alternative_title = Column(String(200), nullable=False)
    alternative_credits = Column(Float, nullable=False)
    course = relationship("RequirementCourse", back_populates="alternatives") 