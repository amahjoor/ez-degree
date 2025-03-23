import os
import re
import json
import sys
import time
import traceback
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import argparse

from .gmu_catalog_parser import parse_gmu_catalog, save_results

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

def load_course_database(project_root=None):
    """
    Load the course database for lookup of course credits and titles.
    
    Args:
        project_root: Path to the project root directory
        
    Returns:
        Dictionary mapping course IDs to course information
    """
    if not project_root:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to project root
    
    # Try different possible locations for the course database
    course_files = [
        os.path.join(project_root, "data", "courses", "all_courses.json"),
        os.path.join(project_root, "data", "all_courses.json")
    ]
    
    for course_file in course_files:
        if os.path.exists(course_file):
            try:
                with open(course_file, 'r', encoding='utf-8') as f:
                    course_data = json.load(f)
                
                # Create a lookup dictionary for fast access
                course_lookup = {}
                
                # Handle structure with "subjects" field
                if "subjects" in course_data:
                    subjects = course_data["subjects"]
                    for dept, courses in subjects.items():
                        for course in courses:
                            if "Code" in course and "Credits" in course and "Title" in course:
                                # Extract department and number from code (e.g., "CS 310" -> "CS", "310")
                                code_parts = course["Code"].split()
                                if len(code_parts) >= 2:
                                    dept_code = code_parts[0]
                                    course_num = code_parts[1]
                                    
                                    # Create a standardized course object
                                    course_obj = {
                                        "id": course["Code"],
                                        "department": dept_code,
                                        "number": course_num,
                                        "title": course["Title"],
                                        "credits": float(course["Credits"]) if course["Credits"] else 0,
                                        "description": course.get("Description", "")
                                    }
                                    
                                    # Use department + number as the key (e.g., "CS310")
                                    key = f"{dept_code}{course_num}"
                                    course_lookup[key] = course_obj
                
                # Handle flat structure of courses
                elif isinstance(course_data, list):
                    for course in course_data:
                        if "id" in course and "department" in course and "number" in course:
                            # Use department + number as the key (e.g., "CS310")
                            key = f"{course['department']}{course['number']}"
                            course_lookup[key] = course
                
                print(f"Loaded {len(course_lookup)} courses from {course_file}")
                return course_lookup
            except Exception as e:
                print(f"Error loading course database from {course_file}: {str(e)}")
                traceback.print_exc()
    
    print("Warning: No course database found. Using default credit values.")
    return {}

def apply_major_specific_corrections(requirements, program_id, program_name, course_lookup=None):
    """
    Apply major-specific corrections to requirements data.
    
    Args:
        requirements: Dictionary of parsed requirements
        program_id: ID of the program
        program_name: Name of the program
        course_lookup: Dictionary mapping course IDs to course information
    """
    # Load course database if not provided
    if course_lookup is None:
        course_lookup = load_course_database()
    
    # Update course information from database first
    update_course_info_from_database(requirements, course_lookup)
    
    # Computer Science-specific corrections
    if program_id == "computer_science_bs" or (program_name and "Computer Science" in program_name and "BS" in program_name):
        # Default credit values for Computer Science categories
        category_defaults = {
            "Computer Science Core": 35,
            "Senior Computer Science": 15,
            "Mathematics Requirements": 17,
            "Statistics": 3,
            "Computer Science Related": 6,
            "Natural Science": 12,
            "Mason Core": 18,
            "Electives": 8
        }
        
        # Apply the defaults where needed
        for category in requirements["categories"]:
            if category["name"] in category_defaults and category["total_credits"] == 0:
                category["total_credits"] = category_defaults[category["name"]]
            
            # Special handling for each category
            if category["name"] == "Senior Computer Science":
                # Senior CS courses are all 3 credits
                for course in category["courses"]:
                    # Only override if not found in database
                    if course["credits"] == 0:
                        course["credits"] = 3
            elif category["name"] == "Computer Science Related":
                # Handle CS Related courses
                for course in category["courses"]:
                    if course["id"].startswith("Select") or course["title"].startswith("Select"):
                        course["credits"] = 6  # The header showing total credits
                    # Only override if not found in database
                    elif course["credits"] == 0:
                        course["credits"] = 3  # Individual courses
            elif category["name"] == "Mason Core":
                # Handle Mason Core courses - typically 3 credits each
                for course in category["courses"]:
                    if course["id"] in ["COMM 100", "ENGH 100", "ENGH 302"]:
                        course["credits"] = 3
                    elif "Advanced Composition" in course["id"]:
                        course["credits"] = 3
                    elif course["credits"] == 0 or course["credits"] > 4:  # If not set or incorrectly distributed
                        course["credits"] = 3
            else:
                # For any other categories
                # Fix "Any MATH" and similar entries
                for course in category["courses"]:
                    if (course["id"].startswith("Any") or "Any " in course["id"]) and course["credits"] < 1:
                        course["credits"] = 3
                
                # For categories with all courses showing 0 credits, distribute evenly
                if category["total_credits"] > 0 and all(course["credits"] == 0 for course in category["courses"]):
                    avg_credit = category["total_credits"] / len(category["courses"])
                    for course in category["courses"]:
                        course["credits"] = avg_credit
        
        # Special handling for natural science requirements
        natural_science_cat = next((cat for cat in requirements["categories"] if cat["name"] == "Natural Science"), None)
        approved_sequences_cat = next((cat for cat in requirements["categories"] if "Approved Two-Course Sequence" in cat["name"]), None)
        
        if natural_science_cat and approved_sequences_cat:
            # Natural Science total is 12 credits
            natural_science_cat["total_credits"] = 12
            
            # The approved two-course sequence makes up 8 of the 12 credits
            approved_sequences_cat["total_credits"] = 8
            
            # Update the Natural Science description to clarify only 4 additional credits are needed
            for course in natural_science_cat["courses"]:
                if "Select" in course["id"] or "Select" in course["title"]:
                    course["title"] = "Select 4 credits of natural science (part of the 12-credit requirement)"
                    course["credits"] = 4
            
            # Update individual course credits in the approved sequences
            sequence_courses = approved_sequences_cat["courses"]
            for course in sequence_courses:
                # Chemistry, Physics, Biology, etc. courses with lab are typically 4 credits each
                if "&" in course["id"] and any(lab_indicator in course["id"] for lab_indicator in ["Lab", "Laboratory", "213", "214", "161", "261", "105", "106"]):
                    # Only override if not found in database
                    if course["credits"] == 0:
                        course["credits"] = 4
                    
            # Add a note to the approved sequences category to indicate it's part of the natural science requirement
            approved_sequences_cat["name"] = "Approved Two-Course Sequences with Laboratories (part of Natural Science requirement)"
    
    # Add more major-specific corrections as needed
    # elif program_id == "some_other_major":
    #     ...

def update_course_info_from_database(requirements, course_lookup):
    """
    Update course information (credits and titles) from the course database.
    
    Args:
        requirements: Dictionary containing parsed requirements
        course_lookup: Dictionary mapping course IDs to course information
    """
    if not course_lookup:
        return
    
    # Process all categories and courses
    for category in requirements.get("categories", []):
        for course in category.get("courses", []):
            # Skip "Select" courses or placeholders
            if course["id"].startswith("Select") or "Select" in course["id"] or "credits" in course["id"].lower():
                continue
                
            # Skip "Any" courses
            if course["id"].startswith("Any") or "Any " in course["id"]:
                continue
                
            # For courses with "&" (combined courses), we can't easily match
            if "&" in course["id"]:
                continue
            
            # Extract department and number for lookup
            if course.get("department") and course.get("number"):
                lookup_key = f"{course['department']}{course['number']}"
                db_course = course_lookup.get(lookup_key)
                
                if db_course:
                    # Update credits if available in database
                    if "credits" in db_course and db_course["credits"] > 0:
                        course["credits"] = db_course["credits"]
                    
                    # Update title if available in database and current title is empty or generic
                    if "title" in db_course and db_course["title"] and (not course["title"] or course["title"] == ""):
                        course["title"] = db_course["title"]
            
            # If we couldn't match with department/number, try with the ID
            elif course["id"] and len(course["id"]) >= 5:  # Minimum length for a course code
                # Try to extract department and number from ID
                match = re.match(r'([A-Z]{2,4})\s*(\d{3}[A-Z]?)', course["id"])
                if match:
                    dept, num = match.groups()
                    lookup_key = f"{dept}{num}"
                    db_course = course_lookup.get(lookup_key)
                    
                    if db_course:
                        # Update credits if available in database
                        if "credits" in db_course and db_course["credits"] > 0:
                            course["credits"] = db_course["credits"]
                        
                        # Update title if available in database and current title is empty or generic
                        if "title" in db_course and db_course["title"] and (not course["title"] or course["title"] == ""):
                            course["title"] = db_course["title"]

def scrape_major_requirements(url, program_id, program_name=None):
    """
    Scrape the major requirements from the given URL.
    
    Args:
        url: URL to the program requirements page
        program_id: ID of the program
        program_name: Name of the program
        
    Returns:
        Dictionary containing the parsed requirements
    """
    # Set up paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to project root
    html_dir = os.path.join(project_root, "data", "majorRequirements", "html_files")
    os.makedirs(html_dir, exist_ok=True)
    html_file = os.path.join(html_dir, f"{program_id}.html")
    json_file = os.path.join(project_root, "data", "majorRequirements", f"{program_id}_requirements.json")
    
    # Load course database
    course_lookup = load_course_database(project_root)
    
    # Try to fetch the HTML content
    try:
        print(f"Fetching URL: {url}")
        response = requests.get(url)
        if response.status_code != 200:
            print(f"Error fetching {url}: Status code {response.status_code}")
            # Try to use existing HTML file if available
            if os.path.exists(html_file):
                print(f"Using existing HTML file: {html_file}")
                with open(html_file, 'r', encoding='utf-8') as f:
                    html_content = f.read()
            else:
                return None
        else:
            html_content = response.text
            # Save the HTML content for future reference
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(html_content)
    except Exception as e:
        print(f"Error fetching {url}: {str(e)}")
        # Try to use existing HTML file if available
        if os.path.exists(html_file):
            print(f"Using existing HTML file: {html_file}")
            with open(html_file, 'r', encoding='utf-8') as f:
                html_content = f.read()
        else:
            return None
    
    # Parse the HTML content
    print(f"Parsing requirements for {program_name if program_name else program_id}")
    try:
        requirements = parse_gmu_catalog(html_content, program_name)
        # Special post-processing for specific majors
        apply_major_specific_corrections(requirements, program_id, program_name, course_lookup)
        return requirements
    except Exception as e:
        print(f"Error parsing HTML content: {str(e)}")
        traceback.print_exc()
        
        # Special handling for Computer Science if we have an existing JSON file
        if program_id == "computer_science_bs" and os.path.exists(json_file):
            print(f"Using special handling for Computer Science, updating existing JSON file")
            return update_existing_cs_requirements(json_file, course_lookup)
        
        return None

def update_existing_cs_requirements(json_file, course_lookup=None):
    """
    Update the existing Computer Science BS requirements JSON file with corrected credits.
    
    Args:
        json_file: Path to the JSON file to update
        course_lookup: Dictionary mapping course IDs to course information
        
    Returns:
        Updated requirements dictionary or None if update failed
    """
    try:
        # Read the existing JSON file
        with open(json_file, 'r', encoding='utf-8') as f:
            requirements = json.load(f)
        
        # Update course information from database first
        if course_lookup is None:
            course_lookup = load_course_database()
        
        update_course_info_from_database(requirements, course_lookup)
        
        # Default credit values for specific categories
        category_defaults = {
            "Computer Science Core": 35,
            "Senior Computer Science": 15,
            "Mathematics Requirements": 17,
            "Statistics": 3,
            "Computer Science Related": 6,
            "Natural Science": 12,
            "Mason Core": 18,
            "Electives": 8
        }
        
        # Apply the defaults where needed
        for category in requirements["categories"]:
            if category["name"] in category_defaults:
                category["total_credits"] = category_defaults[category["name"]]
            
            # Special handling for each category
            if category["name"] == "Senior Computer Science":
                # Senior CS courses are all 3 credits
                for course in category["courses"]:
                    course["credits"] = 3
            elif category["name"] == "Computer Science Related":
                # Handle CS Related courses
                for course in category["courses"]:
                    if course["id"].startswith("Select") or course["title"].startswith("Select"):
                        course["credits"] = 6  # The header showing total credits
                    else:
                        course["credits"] = 3  # Individual courses
            elif category["name"] == "Mason Core":
                # Handle Mason Core courses - typically 3 credits each
                for course in category["courses"]:
                    if course["id"] in ["COMM 100", "ENGH 100", "ENGH 302"]:
                        course["credits"] = 3
                    elif "Advanced Composition" in course["id"]:
                        course["credits"] = 3
                    elif course["credits"] == 0 or course["credits"] > 4:  # If not set or incorrectly distributed
                        course["credits"] = 3
            else:
                # For any other categories
                # Fix "Any MATH" and similar entries
                for course in category["courses"]:
                    if (course["id"].startswith("Any") or "Any " in course["id"]) and course["credits"] < 1:
                        course["credits"] = 3
                
                # For categories with all courses showing 0 credits, distribute evenly
                if category["total_credits"] > 0 and all(course["credits"] == 0 for course in category["courses"]):
                    avg_credit = category["total_credits"] / len(category["courses"])
                    for course in category["courses"]:
                        course["credits"] = avg_credit
        
        # Special handling for natural science requirements
        natural_science_cat = next((cat for cat in requirements["categories"] if cat["name"] == "Natural Science"), None)
        approved_sequences_cat = next((cat for cat in requirements["categories"] if "Approved Two-Course Sequence" in cat["name"]), None)
        
        if natural_science_cat and approved_sequences_cat:
            # Natural Science total is 12 credits
            natural_science_cat["total_credits"] = 12
            
            # The approved two-course sequence makes up 8 of the 12 credits
            approved_sequences_cat["total_credits"] = 8
            
            # Update the Natural Science description to clarify only 4 additional credits are needed
            for course in natural_science_cat["courses"]:
                if "Select" in course["id"] or "Select" in course["title"]:
                    course["title"] = "Select 4 credits of natural science (part of the 12-credit requirement)"
                    course["credits"] = 4
            
            # Update individual course credits in the approved sequences
            sequence_courses = approved_sequences_cat["courses"]
            for course in sequence_courses:
                # Chemistry, Physics, Biology, etc. courses with lab are typically 4 credits each
                if "&" in course["id"] and any(lab_indicator in course["id"] for lab_indicator in ["Lab", "Laboratory", "213", "214", "161", "261", "105", "106"]):
                    course["credits"] = 4
                    
            # Add a note to the approved sequences category to indicate it's part of the natural science requirement
            approved_sequences_cat["name"] = "Approved Two-Course Sequences with Laboratories (part of Natural Science requirement)"
        
        return requirements
    except Exception as e:
        print(f"Error updating existing CS requirements: {str(e)}")
        traceback.print_exc()
        return None

def scrape_all_majors(majors_file=None, output_dir=None, major_ids=None):
    """
    Scrape all majors listed in the majors file.
    
    Args:
        majors_file: Path to the file containing the list of majors
        output_dir: Directory to save the results
        major_ids: List of specific major IDs to scrape (if None, scrape all majors)
    """
    # Load the programs from the all_programs.json file in the project root data folder
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to project root
    
    if not majors_file:
        majors_file = os.path.join(project_root, "data", "majors", "all_programs.json")
    
    if not output_dir:
        output_dir = os.path.join(project_root, "data", "majorRequirements")
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Load the majors data
    try:
        with open(majors_file, "r", encoding='utf-8') as f:
            programs = json.load(f)
        print(f"Loaded {len(programs)} programs from {majors_file}")
    except Exception as e:
        print(f"Error loading majors file: {str(e)}")
        return
    
    # Filter programs by major_ids if specified
    if major_ids:
        original_count = len(programs)
        programs = [p for p in programs if p["id"] in major_ids]
        print(f"Filtered from {original_count} to {len(programs)} programs based on requested major IDs")
        if not programs:
            print(f"No matching programs found for the specified major IDs: {major_ids}")
            return
    
    success_count = 0
    for program in programs:
        program_name = program["name"]
        program_url = program["url"]
        
        print(f"\nProcessing {program_name}...")
        
        try:
            # Scrape the major requirements
            requirements = scrape_major_requirements(program_url, program['id'], program_name)
            
            if requirements:
                # Save the requirements
                save_results(requirements, program_name, output_dir)
                success_count += 1
                print(f"Successfully processed {program_name}")
            else:
                print(f"Failed to process {program_name}")
        except Exception as e:
            print(f"Error processing {program_name}: {str(e)}")
            traceback.print_exc()
    
    print(f"\nFinished scraping {len(programs)} programs. Successfully processed {success_count} programs.")

if __name__ == "__main__":
    # Parse command line arguments for specific majors to scrape
    parser = argparse.ArgumentParser(description="Scrape major requirements from GMU catalog")
    parser.add_argument("--majors", nargs="+", help="Specific major IDs to scrape (e.g., computer_science_bs applied_computer_science_bs)")
    args = parser.parse_args()
    
    if args.majors:
        print(f"Scraping specific majors: {args.majors}")
        scrape_all_majors(major_ids=args.majors)
    else:
        print("Scraping all majors")
        scrape_all_majors()