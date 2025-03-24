#!/usr/bin/env python3
import os
import json
import time
import random
import logging
import re
import argparse
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import undetected_chromedriver as uc

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('selenium_rmp_scraper.log'),
        logging.StreamHandler()
    ]
)

# Constants
GMU_SCHOOL_ID = 352  # George Mason University school ID on RateMyProfessor
DEFAULT_DEPARTMENTS = ["Computer Science"]  # Default departments to search
CS_RELATED_DEPARTMENTS = [
    "Computer Science", 
    "Information Technology", 
    "Computer Game Design", 
    "Data Science",
    "Cyber Security Engineering"
]
OUTPUT_DIR = "data/professors"
HTML_DIR = "data/professors/html_files"
COURSES_DIR = "data/courses"
CS_COURSES_FILE = os.path.join(COURSES_DIR, "cs_courses.json")

def ensure_directories():
    """Create output directories if they don't exist."""
    directories = [OUTPUT_DIR, HTML_DIR]
    for directory in directories:
        if not os.path.exists(directory):
            os.makedirs(directory)
            logging.info(f"Created directory: {directory}")

def get_cs_courses():
    """Load CS courses from JSON file."""
    try:
        with open(CS_COURSES_FILE, 'r') as f:
            data = json.load(f)
            # Check if data is a list or dict and handle accordingly
            if isinstance(data, list):
                # List format
                courses = {}
                for course in data:
                    if 'code' in course:
                        courses[course['code']] = course
                logging.info(f"Loaded CS courses data with {len(courses)} courses")
                return courses
            elif isinstance(data, dict):
                # Dict format
                logging.info(f"Loaded CS courses data with {len(data)} courses")
                return data
            else:
                logging.warning(f"Unexpected format in CS courses data: {type(data)}")
                return {}
    except Exception as e:
        logging.warning(f"Error loading CS courses: {e}")
        return {}

def save_html_content(html_content, filename):
    """Save HTML content to a file for debugging purposes."""
    filepath = os.path.join(HTML_DIR, filename)
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(html_content)
        logging.info(f"Saved HTML content to {filepath}")
        return True
    except Exception as e:
        logging.error(f"Error saving HTML content: {e}")
        return False

def setup_driver():
    """Set up the WebDriver with undetected-chromedriver."""
    options = uc.ChromeOptions()
    options.add_argument("--headless")  # Run in headless mode
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1920,1080")
    
    # Add a user agent to avoid detection
    options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36")
    
    driver = uc.Chrome(options=options)
    logging.info("Successfully initialized undetected Chrome WebDriver")
    return driver

def scrape_professor_list(target_departments=DEFAULT_DEPARTMENTS, max_professors=None):
    """Scrape professor list from RateMyProfessors.com directly using the GMU URL.
    
    Args:
        target_departments: List of departments to include in the search
        max_professors: Maximum number of professors to scrape (None for unlimited)
    
    Returns:
        List of professor data dictionaries
    """
    driver = setup_driver()
    professors = []
    
    try:
        # Navigate directly to GMU professors page
        gmu_url = f"https://www.ratemyprofessors.com/search/professors/{GMU_SCHOOL_ID}?q=*"
        logging.info(f"Searching for professors at George Mason University")
        
        driver.get(gmu_url)
        time.sleep(5)  # Wait for page to load
        
        # Scroll down to load more professors (pagination is handled by scroll)
        logging.info("Scrolling to load more professors...")
        
        # More extensive scrolling to load more professors
        scroll_count = 10  # Increase scrolls to get more professors
        for i in range(scroll_count):
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1.5)  # Slightly longer wait to ensure content loads
            logging.info(f"Scroll {i+1}/{scroll_count} completed")
        
        # Save the HTML content for debugging
        html_content = driver.page_source
        save_html_content(html_content, "search_gmu_professors.html")
        
        # Extract the JSON data from the HTML
        relay_store_pattern = r'window\.__RELAY_STORE__ = ({.*?});'
        matches = re.search(relay_store_pattern, html_content, re.DOTALL)
        
        professor_count = 0
        
        if matches:
            json_data = matches.group(1)
            try:
                relay_store = json.loads(json_data)
                
                # Find professors in the relay store
                for key, value in relay_store.items():
                    if key.startswith("VGVhY2hlci0") and isinstance(value, dict):
                        dept = value.get("department", "")
                        
                        # Check if this professor is in a target department
                        if any(dept.lower() == target_dept.lower() for target_dept in target_departments):
                            prof_data = {
                                "id": value.get("legacyId", ""),
                                "name": f"{value.get('firstName', '')} {value.get('lastName', '')}",
                                "department": dept,
                                "school": "George Mason University",
                                "rating": value.get("avgRating", 0.0),
                                "difficulty": value.get("avgDifficulty", 0.0),
                                "would_take_again": value.get("wouldTakeAgainPercent", 0.0),
                                "num_ratings": value.get("numRatings", 0),
                                "url": f"https://www.ratemyprofessors.com/professor/{value.get('legacyId', '')}"
                            }
                            
                            professors.append(prof_data)
                            professor_count += 1
                            logging.info(f"Found professor: {prof_data['name']} ({dept})")
                            
                            # Check if we've reached the maximum number of professors
                            if max_professors and professor_count >= max_professors:
                                logging.info(f"Reached limit of {max_professors} professors")
                                break
                
                logging.info(f"Found {professor_count} professors from target departments")
            except json.JSONDecodeError as e:
                logging.error(f"Error parsing JSON data: {e}")
        else:
            logging.warning("Could not find RELAY_STORE data in the HTML")
            
        if not professors:
            logging.warning("No professors found. Returning empty results.")
            
        return professors
    except Exception as e:
        logging.error(f"Error scraping professor list: {e}", exc_info=True)
        return []
    finally:
        driver.quit()
        logging.info("WebDriver closed")

def scrape_professor_details(prof_data):
    """Scrape detailed information for a professor."""
    driver = setup_driver()
    
    try:
        url = prof_data["url"]
        prof_id = prof_data["id"]
        
        logging.info(f"Scraping details for professor: {prof_data['name']} at {url}")
        
        driver.get(url)
        time.sleep(random.uniform(2, 4))  # Random wait to avoid detection
        
        # Save the HTML for debugging
        html_content = driver.page_source
        safe_name = prof_data['name'].lower().replace(' ', '_')
        save_html_content(html_content, f"professor_{safe_name}_{prof_id}.html")
        
        # Try to extract detailed ratings from the page
        try:
            # Look for ratings in the page content
            rating_element = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, "//div[contains(@class, 'RatingValue__Numerator')]"))
            )
            prof_data["rating"] = float(rating_element.text.strip() or 0.0)
            
            # Extract difficulty
            difficulty_element = driver.find_element(By.XPATH, "//div[contains(text(), 'Level of Difficulty')]/following-sibling::div")
            difficulty_text = difficulty_element.text.strip()
            prof_data["difficulty"] = float(difficulty_text or 0.0)
            
            # Extract "would take again" percentage
            would_take_again_element = driver.find_element(By.XPATH, "//div[contains(text(), 'Would take again')]/following-sibling::div")
            would_take_again_text = would_take_again_element.text.strip()
            # Handle percentage format (remove % and convert to float)
            if "%" in would_take_again_text:
                prof_data["would_take_again"] = float(would_take_again_text.replace("%", ""))
            else:
                prof_data["would_take_again"] = float(would_take_again_text or 0.0)
                
            logging.info(f"Successfully scraped details for {prof_data['name']}: Rating={prof_data['rating']}, Difficulty={prof_data['difficulty']}")
        except (NoSuchElementException, TimeoutException) as e:
            logging.warning(f"Could not find rating elements for {prof_data['name']}: {e}")
            # Keep the original values from the search page
            
        return prof_data
    except Exception as e:
        logging.error(f"Error scraping professor details: {e}", exc_info=True)
        return prof_data
    finally:
        driver.quit()

def generate_course_difficulty(professors, cs_courses):
    """Generate course difficulty data based on professor ratings."""
    if not professors:
        logging.warning("No professors provided to generate course difficulty data")
        return {}
    
    # Filter to keep only professors with ratings
    rated_professors = [p for p in professors if p.get('rating', 0) > 0]
    
    if not rated_professors:
        logging.warning("No professors with ratings found. Returning empty course difficulty data.")
        return {}
    
    # Create dictionary for course difficulty
    course_difficulty = {}
    
    # Get course codes from CS courses
    course_codes = list(cs_courses.keys()) if cs_courses else []
    
    # If no course codes from real data, use sample list
    if not course_codes:
        course_codes = ['CS 110', 'CS 112', 'CS 211', 'CS 310', 'CS 330', 'CS 367', 'CS 471', 'CS 483']
    
    # Assign professors to courses
    for professor in rated_professors:
        prof_name = professor.get('name')
        prof_difficulty = professor.get('difficulty', 3.0)
        
        # Assign this professor to 1-2 random courses (since we have limited professors in proof of concept)
        num_courses = random.randint(1, 2)
        selected_courses = random.sample(course_codes, min(num_courses, len(course_codes)))
        
        for course_code in selected_courses:
            if course_code not in course_difficulty:
                course_difficulty[course_code] = {
                    'professors': [],
                    'avg_difficulty': 0,
                    'difficulty_level': '',
                    'num_professors': 0
                }
            
            # Add professor to course if not already there
            professor_entry = {
                'name': prof_name,
                'difficulty': prof_difficulty
            }
            
            if not any(p['name'] == prof_name for p in course_difficulty[course_code]['professors']):
                course_difficulty[course_code]['professors'].append(professor_entry)
    
    # Calculate average difficulty for each course
    for course_code, data in course_difficulty.items():
        professors_list = data['professors']
        if professors_list:
            total_difficulty = sum(p['difficulty'] for p in professors_list)
            avg_difficulty = total_difficulty / len(professors_list)
            data['avg_difficulty'] = round(avg_difficulty, 1)
            data['num_professors'] = len(professors_list)
            
            # Categorize difficulty
            if avg_difficulty < 2.5:
                data['difficulty_level'] = 'Easy'
            elif avg_difficulty < 3.5:
                data['difficulty_level'] = 'Medium'
            else:
                data['difficulty_level'] = 'Hard'
    
    return course_difficulty

def save_json_data(data, filename):
    """Save data to a JSON file.
    
    Args:
        data: Data to save
        filename: Path to the output file
    """
    try:
        with open(filename, 'w') as f:
            json.dump(data, f, indent=2)
        logging.info(f"Successfully saved data to {filename}")
    except Exception as e:
        logging.error(f"Error saving data to {filename}: {e}")

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Scrape professor ratings from RateMyProfessors.")
    
    parser.add_argument(
        "--departments", 
        type=str, 
        default="CS",
        help="Comma-separated departments to scrape. Use 'CS' for Computer Science only, "
             "'CS_ALL' for all CS-related departments, or specify custom departments. "
             "Example: 'Computer Science,Mathematics'"
    )
    
    parser.add_argument(
        "--limit", 
        type=int, 
        default=0,
        help="Maximum number of professors to scrape. 0 means unlimited."
    )
    
    return parser.parse_args()

def main():
    """Main function to run the scraper."""
    # Parse command line arguments
    args = parse_arguments()
    
    # Determine target departments based on arguments
    if args.departments.upper() == "CS":
        target_departments = ["Computer Science"]
    elif args.departments.upper() == "CS_ALL":
        target_departments = CS_RELATED_DEPARTMENTS
    else:
        target_departments = [dept.strip() for dept in args.departments.split(",")]
    
    # Determine maximum number of professors to scrape
    max_professors = args.limit if args.limit > 0 else None
    
    logging.info(f"Starting scraper for departments: {target_departments}")
    if max_professors:
        logging.info(f"Limiting to {max_professors} professors")
    
    # Ensure output directories exist
    ensure_directories()
    
    # Get CS courses
    cs_courses = get_cs_courses()
    
    # Scrape professor list
    professors = scrape_professor_list(target_departments, max_professors)
    
    # If no professors were found, return empty results
    if not professors:
        logging.warning("No professors found. Returning empty results.")
        save_json_data([], os.path.join(OUTPUT_DIR, "cs_professor_ratings.json"))
        save_json_data({}, os.path.join(OUTPUT_DIR, "cs_course_difficulty.json"))
        logging.info("Saved empty data files due to no professors found")
        return
    
    try:
        # Scrape details for each professor
        professors_with_details = []
        for i, prof in enumerate(professors):
            # Add some delay between requests, especially for a large number of professors
            if i > 0:
                delay = random.uniform(2.0, 4.0)
                logging.info(f"Waiting {delay:.2f} seconds before next request ({i+1}/{len(professors)})")
                time.sleep(delay)
            
            prof_details = scrape_professor_details(prof)
            if prof_details:
                professors_with_details.append(prof_details)
        
        # Generate course difficulty data
        course_difficulty = generate_course_difficulty(professors_with_details, cs_courses)
        
        # Save data to JSON files
        outfile_prefix = "cs_" if all("computer science" in dept.lower() for dept in target_departments) else ""
        save_json_data(professors_with_details, os.path.join(OUTPUT_DIR, f"{outfile_prefix}professor_ratings.json"))
        save_json_data(course_difficulty, os.path.join(OUTPUT_DIR, f"{outfile_prefix}course_difficulty.json"))
        
        logging.info(f"Saved professor ratings to data/professors/{outfile_prefix}professor_ratings.json")
        logging.info(f"Saved course difficulty to data/professors/{outfile_prefix}course_difficulty.json")
        
    except Exception as e:
        logging.error(f"Error in main scraping process: {e}")
        
        # Save empty data when scraping fails
        logging.warning("Scraping failed. Saving empty data.")
        save_json_data([], os.path.join(OUTPUT_DIR, "cs_professor_ratings.json"))
        save_json_data({}, os.path.join(OUTPUT_DIR, "cs_course_difficulty.json"))
        
        logging.info("Saved empty data files due to scraping error")

if __name__ == "__main__":
    main() 