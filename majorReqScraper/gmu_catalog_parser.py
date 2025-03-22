import os
import re
import json
import sys
from bs4 import BeautifulSoup

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

def extract_course_from_text(text):
    """Extract course code, title, and credits from text"""
    if not text:
        return None
    
    # Extract course code using regex
    code_match = re.search(r'([A-Z]{2,5})\s*(\d{3}[A-Z]?)', text)
    if not code_match:
        return None
    
    course_code = f"{code_match.group(1)} {code_match.group(2)}"
    course_code = clean_course_code(course_code)
    
    # Extract title (text after the course code)
    title_start_pos = code_match.end()
    remaining_text = text[title_start_pos:].strip()
    
    # Handle different formats of title
    # First try to find the title before any credits notation
    title_match = re.search(r'^[:|\s-]*\s*(.*?)(?:\s*\(\d+(?:\.\d+)?\s*credits?\)|\s*\(\d+(?:\.\d+)?\)|\s*\[\d+(?:\.\d+)?\]|\s+\d+\s+credits?|$)', remaining_text, re.IGNORECASE)
    
    title = ""
    if title_match and title_match.group(1):
        title = title_match.group(1).strip()
        
        # Remove common prefixes
        title = re.sub(r'^[-:|]*\s*', '', title)
        
        # Clean up the title
        title = re.sub(r'\s+', ' ', title)  # Normalize whitespace
        title = re.sub(r'(,\s*$|:\s*$|;\s*$)', '', title)  # Remove trailing punctuation
    
    # Extract credits
    credits = extract_credits(text)
    
    # If no title was found, check if there's any descriptive text
    if not title and len(remaining_text) > 2:
        # Use the first sentence or phrase as the title
        title = re.split(r'[.;]', remaining_text)[0].strip()
        title = title[:75]  # Limit title length
    
    # Special handling for titles with "Select from" or similar patterns
    if re.search(r'select|choose|pick', text, re.IGNORECASE):
        select_match = re.search(r'((?:select|choose|pick).*?)(?:\.|\n|$)', text, re.IGNORECASE)
        if select_match:
            title = select_match.group(1).strip()
    
    return {
        "code": course_code,
        "title": title,
        "credits": credits
    }

def find_courses_in_element(element, all_found_courses, current_category):
    """
    Find course codes, titles, and credits in a given element.
    
    Args:
        element: BeautifulSoup element to search within
        all_found_courses: Dictionary of course codes already found to avoid duplicates
        current_category: Current category being processed
        
    Returns:
        List of course dictionaries found in the element
    """
    courses = []
    
    # Look for course patterns in the text
    if element.text:
        # First, look for course codes with pattern like "CS 110", "MATH 113", etc.
        course_pattern = r'([A-Z]{2,4})\s*(\d{3}[A-Z]?)'
        
        # Find all occurrences of course codes
        course_matches = re.finditer(course_pattern, element.text)
        
        for match in course_matches:
            # Get department code and course number
            dept_code = match.group(1)
            course_num = match.group(2)
            course_code = f"{dept_code} {course_num}"
            
            # Skip if already found in this category to avoid duplicates
            if current_category in all_found_courses and course_code in all_found_courses[current_category]:
                continue
            
            # Get surrounding text for title and credits
            start_pos = max(0, match.start() - 50)
            end_pos = min(len(element.text), match.end() + 200)
            surrounding_text = element.text[start_pos:end_pos]
            
            # Try to extract the course title
            title_match = re.search(r'{}\s+([^0-9\(\)]+)'.format(re.escape(course_code)), surrounding_text)
            title = ""
            if title_match:
                title = title_match.group(1).strip()
            
            # Try to find credits
            credit_match = re.search(r'(\d+)\s*credit', surrounding_text, re.IGNORECASE)
            credits = 3  # Default to 3 credits if not found
            if credit_match:
                credits = int(credit_match.group(1))
            
            # Add to courses list
            course = {
                "code": course_code,
                "title": title,
                "credits": credits,
                "alternatives": []
            }
            
            courses.append(course)
            
            # Track this course to avoid duplicates
            if current_category not in all_found_courses:
                all_found_courses[current_category] = set()
            all_found_courses[current_category].add(course_code)
    
    return courses

def extract_alternatives(text, main_course_code):
    """Extract alternative courses from text"""
    alternatives = []
    
    # Look for phrases like "or MATH 114" or "OR CS 112"
    alt_matches = re.finditer(r'(?:or|OR)\s+([A-Z]{2,5})\s*(\d{3}[A-Z]?)', text)
    
    for alt_match in alt_matches:
        alt_code = f"{alt_match.group(1)} {alt_match.group(2)}"
        alt_code = clean_course_code(alt_code)
        
        if alt_code != main_course_code:
            alternatives.append({
                "alternative_code": alt_code,
                "alternative_title": "Alternative Course",
                "alternative_credits": 3  # Default
            })
    
    return alternatives

def parse_gmu_catalog(file_path, major=None):
    """
    Parse the GMU catalog HTML to extract course requirements.
    
    Args:
        file_path: Path to the HTML file
        major: Major name
        
    Returns:
        Dictionary containing the parsed requirements
    """
    # Read the HTML file
    with open(file_path, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    # Parse the HTML content
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Initialize the results structure
    results = {
        "degree_name": major if major else "",
        "total_credits": 0,
        "categories": []
    }
    
    # Try to find the page title if major not provided
    if not major:
        title_elem = soup.find('h1', class_='page-title')
        if title_elem:
            results["degree_name"] = title_elem.text.strip()
    
    # Look for the requirements section
    requirements_div = soup.find('div', id='requirementstextcontainer')
    if not requirements_div:
        print("Warning: Requirements section not found.")
        return results
    
    # Find the toggle content divs which contain categories
    requirement_sections = []
    
    # First, look for h3 elements with class 'toggle' within the requirements div
    # This is the most common structure for category headers
    toggle_headers = requirements_div.find_all('h3', class_='toggle')
    for header in toggle_headers:
        category_title = header.text.strip()
        # Remove "Expand" text which appears in some headers
        category_title = re.sub(r'Expand$', '', category_title).strip()
        
        # Find the associated content div (usually follows the header)
        content_div = None
        next_elem = header.find_next_sibling('div', class_='toggle-content')
        if next_elem:
            content_div = next_elem
        
        if content_div:
            requirement_sections.append({
                'title': category_title,
                'element': content_div
            })
    
    # If not enough sections found with h3.toggle, also look for div with class 'areaheader'
    if len(requirement_sections) < 3:
        area_headers = requirements_div.find_all('div', class_='areaheader')
        for header in area_headers:
            category_title = header.text.strip()
            # Remove any "areaheader" text which may appear
            category_title = re.sub(r'areaheader', '', category_title, flags=re.IGNORECASE).strip()
            
            # Get the parent tr and then look for the content in subsequent rows
            parent_tr = header.find_parent('tr')
            if parent_tr:
                requirement_sections.append({
                    'title': category_title,
                    'element': parent_tr.find_parent('table')
                })
    
    # If still not enough, look for bold text that might indicate section titles
    if len(requirement_sections) < 3:
        # Look for potential category titles in strong, b, or span elements
        potential_headers = requirements_div.find_all(['strong', 'b', 'span', 'h4'])
        for header in potential_headers:
            header_text = header.text.strip()
            
            # Skip if too short or not likely a category title
            if len(header_text) < 3 or header_text.lower() in ['credits', 'code', 'title', 'total']:
                continue
                
            # If it looks like a potential category title
            if re.search(r'(requirements|core|electives|courses)', header_text, re.IGNORECASE):
                # Find the closest parent element that might contain the content
                parent_elem = header.find_parent(['div', 'table', 'section'])
                if parent_elem:
                    requirement_sections.append({
                        'title': header_text,
                        'element': parent_elem
                    })
    
    # Track all found courses to avoid duplicates
    all_found_courses = {}
    
    # Process each requirement section
    for section in requirement_sections:
        category_title = section['title']
        category_element = section['element']
        
        # Standardize common category names
        category_title = standardize_category_name(category_title)
        
        # Skip categories that aren't core curriculum
        if is_excluded_category(category_title):
            continue
        
        # Try to find credits required for this category
        credits_required = find_credits_required(category_element, category_title)
        
        # Find all courses in this category
        courses = []
        
        # First check for a courselist table
        course_tables = category_element.find_all('table', class_='sc_courselist')
        for table in course_tables:
            # Process each row in the table
            for row in table.find_all('tr'):
                courses.extend(find_courses_in_element(row, all_found_courses, category_title))
        
        # If no tables, look for courses in the text
        if not courses:
            courses.extend(find_courses_in_element(category_element, all_found_courses, category_title))
        
        # Only add categories with courses
        if courses:
            results["categories"].append({
                "name": category_title,
                "total_credits": credits_required,
                "courses": courses
            })
    
    # If not enough categories or courses found, scan the entire document as a fallback
    if len(results["categories"]) < 2 or sum(len(cat["courses"]) for cat in results["categories"]) < 5:
        print("Warning: Not enough structured categories found, scanning entire document...")
        fallback_courses = []
        
        # Add a generic category for all found courses
        all_elements = requirements_div.find_all(['p', 'div', 'li', 'td'])
        for element in all_elements:
            fallback_courses.extend(find_courses_in_element(element, all_found_courses, "Degree Requirements"))
        
        if fallback_courses:
            results["categories"].append({
                "name": "Degree Requirements",
                "total_credits": 120,  # Default to 120 for a typical bachelor's
                "courses": fallback_courses
            })
    
    # Calculate total credits
    total_credits = 0
    for category in results["categories"]:
        total_credits += category["total_credits"]
    
    results["total_credits"] = total_credits
    
    return results

def standardize_category_name(name):
    """Standardize common category names"""
    name = name.strip()
    
    # Map of common variations to standard names
    name_map = {
        # Computer Science
        "computer science core": "Computer Science Core",
        "cs core": "Computer Science Core",
        "senior computer science": "Senior Computer Science",
        "senior cs": "Senior Computer Science",
        "cs electives": "Computer Science Electives",
        "computer science electives": "Computer Science Electives",
        "computer science-related courses": "Computer Science Related",
        "cs related courses": "Computer Science Related",
        
        # Math
        "mathematics": "Mathematics Requirements",
        "math": "Mathematics Requirements",
        "mathematics requirements": "Mathematics Requirements",
        
        # Statistics
        "statistics": "Statistics",
        
        # Science
        "natural science": "Natural Science",
        "science": "Natural Science",
        
        # Other common categories
        "mason core": "Mason Core",
        "additional mason core": "Mason Core",
        "electives": "Electives",
    }
    
    # Check for matches in the map (case insensitive)
    lower_name = name.lower()
    for pattern, replacement in name_map.items():
        if pattern in lower_name:
            return replacement
    
    return name

def is_excluded_category(name):
    """Determine if a category should be excluded from curriculum requirements"""
    excluded_patterns = [
        "admission", "policies", "appeal", "advising", "grade", "termination", 
        "repeating", "probation", "suspension", "writing-intensive", "notes", "footnotes"
    ]
    
    name_lower = name.lower()
    for pattern in excluded_patterns:
        if pattern in name_lower:
            return True
    
    return False

def find_credits_required(element, category_name):
    """
    Try to extract the number of credits required for a category.
    Falls back to estimating based on courses if no explicit total is found.
    """
    # Default credits for some known categories
    category_defaults = {
        "Computer Science Core": 35,
        "Senior Computer Science": 15,
        "Mathematics Requirements": 17,
        "Statistics": 3,
        "Natural Science": 12,
        "Mason Core": 24,
        "Electives": 8
    }
    
    # Check if we have a default for this category
    if category_name in category_defaults:
        return category_defaults[category_name]
    
    # Try to find an explicit total in the element
    total_credits = 0
    
    # Check for a "Total Credits" row in tables
    total_row = element.find('tr', class_='listsum')
    if total_row:
        hours_col = total_row.find('td', class_='hourscol')
        if hours_col and hours_col.text:
            try:
                return int(re.search(r'\d+', hours_col.text).group())
            except (AttributeError, ValueError):
                pass
    
    # Look for credit mentions in the text
    credit_patterns = [
        r'(\d+)\s*(?:credit|cr)[s\.]',
        r'total\s*(?:of\s*)?(\d+)\s*credits',
        r'(\d+)\s*total\s*credits'
    ]
    
    for pattern in credit_patterns:
        for text_elem in element.find_all(text=True):
            match = re.search(pattern, text_elem, re.IGNORECASE)
            if match:
                try:
                    return int(match.group(1))
                except ValueError:
                    pass
    
    # If no explicit total found, estimate based on courses
    courses = []
    tables = element.find_all('table', class_='sc_courselist')
    for table in tables:
        for row in table.find_all('tr'):
            # Look for courses
            code_cells = row.find_all('td', class_='codecol')
            for cell in code_cells:
                # Try to find credit value
                hour_cell = row.find('td', class_='hourscol')
                if hour_cell and hour_cell.text:
                    try:
                        credit_match = re.search(r'\d+', hour_cell.text)
                        if credit_match:
                            total_credits += int(credit_match.group())
                    except ValueError:
                        # If no credit value, assume 3 credits per course as default
                        total_credits += 3
    
    # If still 0, assume a reasonable default (3 credits per course found)
    if total_credits == 0:
        course_count = len(element.find_all('a', class_='bubblelink code'))
        if course_count > 0:
            total_credits = course_count * 3
        else:
            total_credits = 3  # Minimum default
    
    return total_credits

def save_results(results, major):
    """
    Save the parsed requirements to both JSON and SQL format.
    
    Args:
        results: Dictionary of parsed requirements
        major: Major name to use for the filenames
    """
    # Create a filename-safe version of the major name
    if major:
        filename_base = major.lower().replace(',', '').replace(' ', '_')
    else:
        filename_base = "unknown_major"
    
    # Create the data directory if it doesn't exist
    data_dir = "data"
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    # Save as JSON
    json_path = os.path.join(data_dir, f"{filename_base}_requirements.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    # Save as SQL
    sql_path = os.path.join(data_dir, f"{filename_base}_requirements.sql")
    
    with open(sql_path, 'w', encoding='utf-8') as f:
        # Write SQL for the major
        major_id = filename_base.replace('_', '')[:30]  # Create a simple ID from the filename
        f.write(f"-- SQL for {results['degree_name']}\n\n")
        f.write("-- Insert into majors table\n")
        f.write(f"INSERT INTO majors (id, name, total_credits) VALUES ('{major_id}', '{results['degree_name']}', {results['total_credits']});\n\n")
        
        # Write SQL for each category
        f.write("-- Insert into categories table\n")
        for i, category in enumerate(results['categories']):
            category_id = f"{major_id}_cat_{i}"
            f.write(f"INSERT INTO categories (id, major_id, name, credits_required) VALUES ('{category_id}', '{major_id}', '{category['name']}', {category['total_credits']});\n")
        
        f.write("\n-- Insert into courses table\n")
        for i, category in enumerate(results['categories']):
            category_id = f"{major_id}_cat_{i}"
            for j, course in enumerate(category['courses']):
                course_id = f"{category_id}_course_{j}"
                course_code = course['code'].replace(' ', '')  # Remove spaces from course code
                title = course['title'].replace("'", "''")  # Escape single quotes for SQL
                f.write(f"INSERT INTO courses (id, category_id, course_code, title, credits) VALUES ('{course_id}', '{category_id}', '{course_code}', '{title}', {course['credits']});\n")
    
    print(f"Results saved to {json_path} and {sql_path}")

def main():
    """Main function to parse the GMU catalog HTML file"""
    if len(sys.argv) < 2:
        print("Usage: python gmu_catalog_parser.py <html_file> [major_name]")
        sys.exit(1)
    
    html_file = sys.argv[1]
    
    major = None
    if len(sys.argv) > 2:
        major = sys.argv[2]
    
    results = parse_gmu_catalog(html_file, major)
    
    # Print some stats
    total_courses = sum(len(category["courses"]) for category in results["categories"])
    print(f"Found {len(results['categories'])} categories with a total of {total_courses} courses and {results['total_credits']} total credits.")
    
    # Save results
    save_results(results, major)

if __name__ == "__main__":
    main() 