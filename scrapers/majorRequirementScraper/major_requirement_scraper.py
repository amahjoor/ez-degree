import os
import re
import json
import sys
import time
import traceback
import requests
from bs4 import BeautifulSoup
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
    
    try:
        # Set output directory to project root data folder
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to project root
        output_dir = os.path.join(project_root, "data", "majorRequirements")
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Create html_files subdirectory if it doesn't exist
        html_files_dir = os.path.join(output_dir, "html_files")
        if not os.path.exists(html_files_dir):
            os.makedirs(html_files_dir)
        
        # Fetch the HTML content
        print(f"Fetching URL: {url}")
        response = requests.get(url)
        
        # Check if request was successful
        if response.status_code != 200:
            print(f"Error: Failed to fetch URL. Status code: {response.status_code}")
            return None
        
        # Save the HTML content for debugging
        major_id = major.lower().replace(' ', '_').replace(',', '').replace('/', '_')
        debug_file = os.path.join(html_files_dir, f"{major_id}.html")
        with open(debug_file, "w", encoding='utf-8') as f:
            f.write(response.text)
        
        print(f"HTML content saved to {debug_file}")
        
        # Use the specialized GMU catalog parser to extract requirements directly from HTML content
        print("Parsing requirements...")
        requirements = parse_gmu_catalog(response.text, major)
        
        if requirements and requirements.get('categories'):
            print(f"Successfully parsed {len(requirements['categories'])} requirement categories")
            # Save the requirements to JSON and SQL files
            save_results(requirements, major)
            return requirements
        else:
            print("Warning: No requirement categories found!")
            return None
        
    except Exception as e:
        print(f"Error scraping {major}: {str(e)}")
        traceback.print_exc()
        return None

def scrape_all_majors():
    """Main function to run the scraper for all majors"""
    # Load the programs from the all_programs.json file in the project root data folder
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to project root
    data_dir = os.path.join(project_root, 'data')
    majors_dir = os.path.join(data_dir, 'majors')
    
    # Try to load from majors directory first, fall back to data directory
    all_programs_path = os.path.join(majors_dir, 'all_programs.json')
    if not os.path.exists(all_programs_path):
        # Fall back to the old location
        all_programs_path = os.path.join(data_dir, 'all_programs.json')
        if not os.path.exists(all_programs_path):
            print(f"Error: File not found: {all_programs_path}")
            print("Please run programs_scraper.py first to generate the all_programs.json file.")
            return
    
    with open(all_programs_path, 'r') as f:
        programs = json.load(f)
    
    print(f"Loaded {len(programs)} bachelor's programs")
    
    # Get user input for how many programs to process
    try:
        num_to_process = input("How many programs to process? (Enter a number, or press Enter for all): ")
        if num_to_process.strip():
            programs_to_process = programs[:int(num_to_process)]
        else:
            programs_to_process = programs
    except ValueError:
        print("Invalid input. Processing all programs.")
        programs_to_process = programs
    
    print(f"Processing {len(programs_to_process)} programs...")
    
    # Initialize counters
    success_count = 0
    fail_count = 0
    
    # Process each program
    for i, program in enumerate(programs_to_process):
        program_name = program['name']
        program_url = program['url']
        
        print(f"\n[{i+1}/{len(programs_to_process)}] Processing: {program_name}")
        print(f"URL: {program_url}")
        
        try:
            # Scrape the major requirements
            requirements = scrape_major_requirements(program_name, program_url)
            
            if requirements:
                # Results are saved within the scrape_major_requirements function
                success_count += 1
                print(f"Successfully processed {program_name}")
            else:
                fail_count += 1
                print(f"Failed to process {program_name}")
        except Exception as e:
            print(f"Error processing {program_name}: {str(e)}")
            traceback.print_exc()
            fail_count += 1
        
        # Add a delay to avoid overwhelming the server
        time.sleep(2)
    
    print(f"\nScraping complete!")
    print(f"Total programs processed: {len(programs_to_process)}")
    print(f"Successful: {success_count}")
    print(f"Failed: {fail_count}")
    print(f"Results saved in: {data_dir}")

if __name__ == "__main__":
    scrape_all_majors()