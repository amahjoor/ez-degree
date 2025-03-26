from sqlalchemy import text
from database.db import engine

def migrate():
    """Add overall_rating and overall_difficulty columns to courses table."""
    with engine.connect() as connection:
        # Add overall_rating column
        connection.execute(text("""
            ALTER TABLE courses 
            ADD COLUMN IF NOT EXISTS overall_rating FLOAT
        """))
        
        # Add overall_difficulty column
        connection.execute(text("""
            ALTER TABLE courses 
            ADD COLUMN IF NOT EXISTS overall_difficulty FLOAT
        """))
        
        connection.commit()
        print("Successfully added rating columns to courses table")

if __name__ == "__main__":
    migrate() 