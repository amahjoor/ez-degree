from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time

class CourseRequirement:
    def __init__(self):
        self.code = ""
        self.title = ""
        self.credits = 0
        self.prerequisites = []
        self.alternatives = []

def get_category(header_text):
    header_text = header_text.lower()
    if "computer science core" in header_text:
        return "cs_core"
    elif "senior computer science" in header_text:
        return "senior_cs"
    elif "mathematics" in header_text and "required" in header_text:
        return "mathematics"
    elif "statistics" in header_text:
        return "statistics"
    elif "computer science-related courses" in header_text:
        return "cs_related"
    elif "natural science" in header_text:
        return "natural_science"
    elif "mason core" in header_text:
        return "mason_core"
    return None

def scrape_cs_requirements():
    url = "https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/computer-science/computer-science-bs/"
    
    requirements = {
        "cs_core": [],
        "senior_cs": [],
        "mathematics": [],
        "statistics": [],
        "cs_related": [],
        "natural_science": [],
        "mason_core": []
    }
    
    try:
        driver = webdriver.Chrome()
        driver.get(url)
        
        # Wait for the requirements section to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "requirementstext"))
        )
        
        req_section = driver.find_element(By.ID, "requirementstext")
        
        current_category = None
        
        # Look for headers and course lists
        for element in req_section.find_elements(By.TAG_NAME, "h3"):
            if element.text.strip():
                current_category = get_category(element.text.strip())
            elif element.find_elements(By.TAG_NAME, "table"):
                courses = element.find_elements(By.TAG_NAME, "table")
                for course in courses:
                    # Skip header rows
                    if course.find_elements(By.TAG_NAME, "th"):
                        continue
                        
                    # Extract course information
                    course_code = course.find_element(By.CLASS_NAME, "code")
                    course_title = course.find_element(By.CLASS_NAME, "title")
                    course_credits = course.find_element(By.CLASS_NAME, "hours")
                    
                    if course_code and course_title:
                        requirement = CourseRequirement()
                        requirement.code = course_code.text.strip()
                        requirement.title = course_title.text.strip()
                        if course_credits:
                            try:
                                requirement.credits = float(course_credits.text.strip())
                            except ValueError:
                                requirement.credits = 0
                                
                        requirements[current_category].append(requirement)
        
        driver.quit()
        
        return requirements
        
    except Exception as e:
        print(f"Error scraping requirements: {str(e)}")
        return None

def main():
    requirements = scrape_cs_requirements()
    if requirements:
        for category, courses in requirements.items():
            print(f"\n{category.upper()}:")
            for course in courses:
                print(f"{course.code}: {course.title} ({course.credits} credits)")

if __name__ == "__main__":
    main()