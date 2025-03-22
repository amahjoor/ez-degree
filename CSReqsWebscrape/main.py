import os
import re
import json
import sys
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException
from bs4 import BeautifulSoup

class Course:
    """Class representing a course with its code, title, credits, and alternatives"""
    def __init__(self, code, title, credits, alternatives):
        self.code = code
        self.title = title
        self.credits = credits
        self.alternatives = alternatives
    
    def to_dict(self):
        return {
            "code": self.code,
            "title": self.title,
            "credits": self.credits,
            "alternatives": self.alternatives
        }

class CategoryRequirement:
    """Class representing a category of course requirements"""
    def __init__(self, name):
        self.name = name
        self.total_credits = 0
        self.courses = []
    
    def to_dict(self):
        return {
            "name": self.name,
            "total_credits": self.total_credits,
            "courses": [course.to_dict() for course in self.courses]
        }
    
    def add_course(self, course):
        self.courses.append(course)
        self.total_credits += course.credits

def clean_course_code(code):
    """Clean up course code formatting"""
    # Remove non-breaking spaces and replace with regular spaces
    code = code.replace('\u00a0', ' ')
    # Convert multiple spaces to single space
    code = re.sub(r'\s+', ' ', code).strip()
    return code

def extract_credits(text):
    """Extract credits from text"""
    if not text:
        return 0
    
    # Look for credit pattern in text
    credit_match = re.search(r'(\d+\.?\d*)\s*credits?', text, re.IGNORECASE)
    if credit_match:
        return float(credit_match.group(1))
    
    # Look for just a number that might represent credits
    number_match = re.search(r'(\d+\.?\d*)', text)
    if number_match:
        return float(number_match.group(1))
    
    return 0

def scrape_major_requirements(driver, major, url):
    print(f"Scraping requirements for '{major}'...")
    
    try:
        driver.get(url)
        time.sleep(5)  # Increased wait time to ensure page loads
        
        print(f"Page title: {driver.title}")
        
        # Check if page loaded successfully (not 404)
        if "404" in driver.title or "Page Not Found" in driver.title:
            print(f"Error: Page not found for {major} - URL may be incorrect: {url}")
            return None
        
        # Save the full HTML for parsing with BeautifulSoup
        html_content = driver.page_source
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Try to find the requirements container
        requirements_container = soup.find(id="requirementstextcontainer")
        
        if not requirements_container:
            print("Could not find requirements container, saving HTML for debugging")
            with open(f"debug_{major.lower().replace(' ', '_')}.html", "w") as f:
                f.write(html_content)
            return None
        
        print(f"Found requirements container, processing content")
        
        # Extract total credits
        total_credits = 0.0
        total_credits_text = requirements_container.find('p')
        if total_credits_text:
            total_credits_match = re.search(r'Total.*?(\d+\.?\d*)', total_credits_text.text)
            if total_credits_match:
                total_credits = float(total_credits_match.group(1))
                print(f"Found total credits: {total_credits}")
        
        # Find toggle sections (these contain the different requirement categories)
        toggle_sections = requirements_container.find_all(class_="toggle")
        print(f"Found {len(toggle_sections)} toggle sections")
        
        categories = []
        total_calculated_credits = 0.0
        
        # Process each toggle section (category)
        for toggle in toggle_sections:
            try:
                # Get the category name from the toggle header
                toggle_header = toggle.find(class_="toggle-header")
                if not toggle_header:
                    continue
                    
                category_name = toggle_header.text.strip()
                # Remove "Expand" from category names
                category_name = re.sub(r'Expand\s*$', '', category_name)
                print(f"Processing category: {category_name}")
                
                # Get the content section
                content_section = toggle.find(class_="toggle-content")
                if not content_section:
                    continue
                
                # Find tables in the content section
                tables = content_section.find_all('table')
                print(f"Found {len(tables)} tables in category '{category_name}'")
                
                category = CategoryRequirement(category_name)
                
                # Process each table
                for table in tables:
                    rows = table.find_all('tr')
                    
                    # Skip header row
                    for i, row in enumerate(rows):
                        if i == 0:  # Skip header row
                            continue
                        
                        cells = row.find_all('td')
                        if len(cells) < 2:
                            continue
                        
                        # Extract course code from first cell
                        course_code = clean_course_code(cells[0].text.strip())
                        
                        # Skip rows that don't have a valid course code
                        if not re.match(r'^[A-Z]{2,4}\s\d{3}', course_code):
                            continue
                        
                        # Extract course title from second cell
                        course_title = cells[1].text.strip()
                        
                        # Check if this is an alternative or option
                        alternatives = []
                        
                        # Try to extract credits from last cell
                        credits = 0.0
                        if len(cells) > 2:
                            credits_cell = cells[-1]
                            credits_text = credits_cell.text.strip()
                            
                            # Try to find credits in the text
                            credits_match = re.search(r'(\d+\.?\d*)\s*credits?', credits_text, re.IGNORECASE)
                            if credits_match:
                                credits = float(credits_match.group(1))
                        
                        # If no credits found, check in title
                        if credits == 0:
                            credits_match = re.search(r'(\d+\.?\d*)\s*credits?', course_title, re.IGNORECASE)
                            if credits_match:
                                credits = float(credits_match.group(1))
                        
                        # If still no credits, set defaults based on course type
                        if credits == 0:
                            # Check if it's a lab course
                            if "lab" in course_title.lower():
                                credits = 1.0
                            # Set known courses with standard credit values
                            elif course_code in ["MATH 113", "MATH 114", "MATH 213", "CS 112", "CS 367"]:
                                credits = 4.0
                            else:
                                # Default for most courses
                                credits = 3.0
                        
                        # Create and add the course
                        course = Course(course_code, course_title, credits, alternatives)
                        category.add_course(course)
                        total_calculated_credits += credits
                        print(f"Added course: {course_code} - {credits} credits")
                
                # Add the category if it has courses
                if category.courses:
                    categories.append(category)
                    print(f"Added category: {category_name} with {len(category.courses)} courses, {category.total_credits} credits")
            
            except Exception as e:
                print(f"Error processing category: {e}")
        
        # If no categories found, try direct parsing
        if not categories:
            print("No categories found through toggle sections. Trying direct table extraction...")
            
            # Find all tables in the requirements section
            tables = requirements_container.find_all('table')
            
            if tables:
                print(f"Found {len(tables)} tables directly in requirements container")
                
                # Process each table as a separate category
                for i, table in enumerate(tables):
                    # Try to find a preceding heading for the category name
                    category_name = f"Requirement Section {i+1}"
                    
                    # Look for preceding h3/h4 element
                    prev_elem = table.find_previous(['h3', 'h4', 'h5'])
                    if prev_elem and prev_elem.text:
                        category_name = prev_elem.text.strip()
                        # Remove "Expand" from category names
                        category_name = re.sub(r'Expand\s*$', '', category_name)
                    
                    print(f"Processing direct table category: {category_name}")
                    
                    category = CategoryRequirement(category_name)
                    
                    # Process rows in the table
                    rows = table.find_all('tr')
                    
                    for i, row in enumerate(rows):
                        if i == 0:  # Skip header row
                            continue
                        
                        cells = row.find_all('td')
                        if len(cells) < 2:
                            continue
                        
                        # Extract course code
                        course_code = clean_course_code(cells[0].text.strip())
                        
                        # Skip rows without valid course code
                        if not re.match(r'^[A-Z]{2,4}\s\d{3}', course_code):
                            continue
                        
                        # Extract course title
                        course_title = cells[1].text.strip()
                        
                        # Try to get credits
                        credits = 0.0
                        if len(cells) > 2:
                            credits_text = cells[-1].text.strip()
                            credits_match = re.search(r'(\d+\.?\d*)\s*credits?', credits_text, re.IGNORECASE)
                            if credits_match:
                                credits = float(credits_match.group(1))
                        
                        # Apply defaults if needed
                        if credits == 0:
                            if "lab" in course_title.lower():
                                credits = 1.0
                            elif course_code in ["MATH 113", "MATH 114", "MATH 213", "CS 112", "CS 367"]:
                                credits = 4.0
                            else:
                                credits = 3.0
                        
                        # Create and add course
                        course = Course(course_code, course_title, credits, alternatives=[])
                        category.add_course(course)
                        total_calculated_credits += credits
                    
                    # Add category if it has courses
                    if category.courses:
                        categories.append(category)
                        print(f"Added direct category: {category_name} with {len(category.courses)} courses")
        
        # Calculate major requirements (typically 120 credits for a BS)
        # GMU's CS program requires 120 credits, so cap it at that if our calculated total is higher
        if total_credits == 0.0:
            if total_calculated_credits > 120:
                print(f"Calculated credits ({total_calculated_credits}) exceeds typical BS requirement. Setting to 120.0")
                total_credits = 120.0
            else:
                total_credits = total_calculated_credits
                print(f"Using calculated total credits: {total_credits}")
        
        # Create requirements dictionary
        requirements = {
            "degree_name": major,
            "total_credits": total_credits,
            "categories": [category.to_dict() for category in categories]
        }
        
        return requirements
    except Exception as e:
        print(f"Error scraping requirements for {major}: {e}")
        import traceback
        traceback.print_exc()
        return None

def save_to_sql(requirements, filename=None):
    """Save requirements to SQL insert statements"""
    if not filename:
        filename = f"{requirements['degree_name'].lower().replace(' ', '_')}_requirements.sql"
    
    # Create output directory if it doesn't exist
    output_dir = "majorRequirements"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Set file path within the output directory
    file_path = os.path.join(output_dir, filename)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write("-- SQL Insert statements for GMU CS Requirements\n")
        f.write("-- Generated from the web scraper\n\n")
        
        # Insert degree program
        f.write("-- Insert Degree Program\n")
        f.write(f"INSERT INTO degree_programs (name, total_credits, description) VALUES ('{requirements['degree_name']}', {requirements['total_credits']}, 'Bachelor of Science in Computer Science') ON CONFLICT (name) DO UPDATE SET total_credits = {requirements['total_credits']};\n\n")
        
        # Insert categories
        f.write("-- Insert Categories\n")
        for i, category in enumerate(requirements['categories']):
            f.write(f"INSERT INTO requirement_categories (name, degree_id, total_credits) VALUES ('{category['name']}', 1, {category['total_credits']}) ON CONFLICT (name, degree_id) DO UPDATE SET total_credits = {category['total_credits']};\n")
        
        f.write("\n-- Insert Courses\n")
        # Insert courses
        for category in requirements['categories']:
            for course in category['courses']:
                # Escape single quotes in title
                title = course['title'].replace("'", "''")
                f.write(f"INSERT INTO courses (code, title, credits) VALUES ('{course['code']}', '{title}', {course['credits']}) ON CONFLICT (code) DO UPDATE SET title = '{title}', credits = {course['credits']};\n")
        
        f.write("\n-- Insert Category Requirements\n")
        # Insert category requirements
        for cat_idx, category in enumerate(requirements['categories']):
            for course in category['courses']:
                f.write(f"INSERT INTO category_requirements (category_id, course_id) VALUES ({cat_idx + 1}, (SELECT id FROM courses WHERE code = '{course['code']}')) ON CONFLICT (category_id, course_id) DO NOTHING;\n")
        
        f.write("\n-- Insert Course Alternatives\n")
        # Insert alternatives
        for category in requirements['categories']:
            for course in category['courses']:
                if course['alternatives']:
                    for alt in course['alternatives']:
                        f.write(f"INSERT INTO course_alternatives (course_id, alt_course_id) VALUES ((SELECT id FROM courses WHERE code = '{course['code']}'), (SELECT id FROM courses WHERE code = '{alt}')) ON CONFLICT (course_id, alt_course_id) DO NOTHING;\n")
    
    print(f"SQL insert statements saved to {file_path}")
    return file_path

def main():
    """Main function to run the scraper"""
    print("Scraping GMU major requirements...")
    
    # Configure Chrome options
    chrome_options = Options()
    chrome_options.add_argument("--headless")  # Run headless
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920x1080")
    
    # Initialize the driver
    driver = webdriver.Chrome(options=chrome_options)
    
    try:
        # Define majors to scrape - URLs verified from GMU catalog search
        majors = [
            {
                "name": "Computer Science BS",
                "url": "https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/computer-science/computer-science-bs/#requirementstext"
            },
            {
                "name": "Information Technology BS",
                "url": "https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/information-sciences-technology/information-technology-bs/#requirementstext"
            },
            {
                "name": "Applied Computer Science BS",
                "url": "https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/computer-science/applied-computer-science-bs/#requirementstext"
            },
            {
                "name": "Cybersecurity Engineering BS",
                "url": "https://catalog.gmu.edu/colleges-schools/engineering-computing/engineering/cyber-security-engineering/cyber-security-engineering-bs/#requirementstext"
            },
            {
                "name": "Computer Engineering BS",
                "url": "https://catalog.gmu.edu/colleges-schools/engineering-computing/engineering/electrical-computer/computer-engineering-bs/#requirementstext"
            },
            {
                "name": "Statistics BS",
                "url": "https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/statistics/statistics-bs/#requirementstext"
            }
        ]
        
        # Create output directory if it doesn't exist
        output_dir = "majorRequirements"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Track success and failures
        success_count = 0
        failure_count = 0
        
        # Scrape each major
        for major_info in majors:
            major_name = major_info["name"]
            major_url = major_info["url"]
            
            try:
                # Scrape the requirements
                requirements = scrape_major_requirements(driver, major_name, major_url)
                
                if requirements:
                    # Create filename from major name
                    filename = f"{major_name.lower().replace(' ', '_')}_requirements.json"
                    file_path = os.path.join(output_dir, filename)
                    
                    # Save to JSON
                    with open(file_path, 'w', encoding='utf-8') as f:
                        json.dump(requirements, f, indent=2)
                    print(f"Requirements saved to {file_path}")
                    
                    # Generate SQL file
                    save_to_sql(requirements)
                    success_count += 1
                else:
                    print(f"Failed to scrape requirements for {major_name}")
                    failure_count += 1
            except Exception as e:
                print(f"Error processing {major_name}: {e}")
                failure_count += 1
    
    finally:
        # Close the driver
        driver.quit()
    
    print(f"Scraping complete. Successfully scraped {success_count} majors, failed to scrape {failure_count} majors.")

if __name__ == "__main__":
    main()