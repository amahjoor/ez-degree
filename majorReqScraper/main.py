import os
import re
import json
import sys
import time
import traceback
import requests
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import NoSuchElementException
from bs4 import BeautifulSoup
from programs_scraper import extract_programs_from_html
from gmu_catalog_parser import parse_gmu_catalog, save_results

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
    number_match = re.search(r'\((\d+\.?\d*)\)', text)
    if number_match:
        return float(number_match.group(1))
    
    return 3  # Default to 3 credits if we can't determine

def scrape_major_requirements(major, url):
    """
    Scrape requirements for a major from the given URL.
    
    Args:
        major (str): The name of the major (e.g., "Computer Science, BS")
        url (str): The URL to the requirements page
    
    Returns:
        dict: Requirements data or None if scraping failed
    """
    print(f"Scraping requirements for '{major}'...")
    
    # Initialize the web driver
    options = Options()
    options.add_argument('--headless')  # Run in headless mode
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Chrome(options=options)
    
    try:
        # Create the output directory if it doesn't exist
        output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "majorRequirements")
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        # Load the page
        driver.get(url)
        time.sleep(3)  # Wait for page to load
        
        print(f"Page title: {driver.title}")
        
        # Check if page loaded successfully (not 404)
        if "404" in driver.title or "Page Not Found" in driver.title:
            print(f"Error: Page not found for {major} - URL may be incorrect: {url}")
            return None
        
        # Save the full HTML for debugging
        major_id = major.lower().replace(' ', '_').replace(',', '').replace('/', '_')
        debug_file = os.path.join(output_dir, f"debug_{major_id}.html")
        with open(debug_file, "w", encoding='utf-8') as f:
            f.write(driver.page_source)
        
        # Use our specialized GMU catalog parser to extract requirements
        requirements = parse_gmu_catalog(driver.page_source, major)
        
        # Save the requirements data
        save_results(requirements, major)
        
        return requirements
        
    except Exception as e:
        print(f"Error scraping {major}: {str(e)}")
        traceback.print_exc()
        return None
        
    finally:
        driver.quit()

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
                        f.write(f"INSERT INTO course_alternatives (course_id, alt_course_id) VALUES ((SELECT id FROM courses WHERE code = '{course['code']}'), (SELECT id FROM courses WHERE code = '{alt['alternative_code']}')) ON CONFLICT (course_id, alt_course_id) DO NOTHING;\n")
    
    print(f"SQL insert statements saved to {file_path}")
    return file_path

def main():
    # Load the programs from the bachelor_programs.json file
    with open('bachelor_programs.json', 'r') as f:
        programs = json.load(f)
    
    print(f"Loaded {len(programs)} bachelor's programs")
    
    # Process only the first 5 programs
    programs_to_process = programs[:5]
    print(f"Processing {len(programs_to_process)} programs...")
    
    # Initialize counters
    success_count = 0
    fail_count = 0
    
    # Create directories if they don't exist
    data_dir = 'data'
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    html_dir = os.path.join(data_dir, 'html_files')
    if not os.path.exists(html_dir):
        os.makedirs(html_dir)
    
    for program in programs_to_process:
        program_name = program['name']
        program_url = program['url']
        
        print(f"\nProcessing: {program_name}")
        
        try:
            # Scrape the HTML
            response = requests.get(program_url)
            response.raise_for_status()  # Raise an exception for HTTP errors
            html_content = response.text
            
            # Save the HTML file
            major_filename_base = program_name.lower().replace(',', '').replace(' ', '_')
            html_filename = os.path.join(html_dir, f"{major_filename_base}.html")
            with open(html_filename, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            print(f"  HTML saved to {html_filename}")
            
            # Parse the requirements
            requirements = parse_gmu_catalog(html_filename, program_name)
            
            # Save the results
            save_results(requirements, program_name)
            
            success_count += 1
            
        except Exception as e:
            print(f"  Error processing {program_name}: {str(e)}")
            traceback.print_exc()
            fail_count += 1
        
        # Add a delay to avoid overwhelming the server
        time.sleep(3)
    
    print(f"\nScraping complete!")
    print(f"Total programs processed: {len(programs_to_process)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {fail_count}")

if __name__ == "__main__":
    main()