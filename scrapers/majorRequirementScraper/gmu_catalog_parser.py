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
    
    # Extract course code using regex - FIXED: removed [A-Z]? to prevent capturing title's first letter
    code_match = re.search(r'([A-Z]{2,5})\s*(\d{3})', text)
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

def extract_title_from_text(text, course_code):
    """Extract course title from surrounding text."""
    # Try different patterns to find title
    # Look for title after the course code
    title_match = re.search(rf'{re.escape(course_code)}\s*[:-]?\s*([^()\n\r.]*[a-zA-Z][^()\n\r.]*)', text)
    if title_match:
        return title_match.group(1).strip()
    
    # Look for title before any mention of credits
    credit_pos = text.find('credits')
    if credit_pos > 0:
        before_credits = text[:credit_pos]
        title_match = re.search(r'[:-]\s*([^()\n\r.]*[a-zA-Z][^()\n\r.]*?)$', before_credits)
        if title_match:
            return title_match.group(1).strip()
    
    # Look for phrases like "Select from..."
    select_match = re.search(r'Select\s+(?:from|one\s+of|one\s+from)\s+(.+?)(?:\.|\n|$)', text)
    if select_match:
        return select_match.group(0).strip()
    
    # If all else fails, return empty string
    return ""

def extract_department_and_number(course_code):
    """Extract department and course number from a course code."""
    # Split on whitespace and handle potential format variations
    parts = course_code.strip().split()
    if len(parts) >= 2:
        department = parts[0]
        number = parts[1]
        return department, number
    return "", ""  # Return empty strings if parsing fails

def find_courses_in_element(element, all_found_courses=None):
    """Find all courses in this element. Return list of found courses."""
    if all_found_courses is None:
        all_found_courses = {}
    
    found_courses = []
    
    # First, try to find courses in table rows with codecol
    codecol_cells = element.find_all('td', class_='codecol')
    for codecol in codecol_cells:
        course_code_element = codecol.find('a', class_='code')
        if not course_code_element:
            continue
        
        course_code = course_code_element.text.strip()
        if course_code in all_found_courses:
            continue
        
        # Get course title from next sibling td element (not td with class hourscol)
        title_cell = codecol.find_next_sibling('td')
        title = ""
        if title_cell and not title_cell.has_attr('class'):
            # Extract title, removing nested tags and specific text
            title = title_cell.get_text(strip=True)
            title = re.sub(r'\(Mason Core\)', '', title).strip()
            
        # Get credit hours from third cell with class hourscol
        credits_cell = codecol.find_next_sibling('td', class_='hourscol')
        credits = 3  # Default to 3 if not specified
        if credits_cell and credits_cell.string and credits_cell.string.strip().isdigit():
            credits = int(credits_cell.string.strip())
        
        # Get alternatives if any
        alternatives = []
        parent_row = codecol.parent
        if parent_row:
            row_text = parent_row.get_text()
            alternatives = extract_alternatives(row_text, course_code)
            
        course_id = course_code
        department, number = extract_department_and_number(course_code)
        
        course = {
            'id': course_id,
            'department': department,
            'number': number, 
            'title': title,
            'credits': credits,
            'alternatives': alternatives
        }
        
        all_found_courses[course_id] = course
        found_courses.append(course)
    
    # If no courses found in tables, try to find in text
    if not all_found_courses:
        text = element.get_text()
        # Look for course codes like "CS 112" in the text
        matches = re.finditer(r'([A-Z]{2,4})\s*(\d{3})', text)
        for match in matches:
            full_code = match.group(1) + ' ' + match.group(2)
            if full_code in all_found_courses:
                continue
            
            # Try to extract title around the course code
            surrounding_text = text[max(0, match.start() - 100):min(len(text), match.end() + 100)]
            title = extract_title_from_text(surrounding_text, full_code)
            
            department = match.group(1)
            number = match.group(2)
            
            # Extract alternatives
            alternatives = extract_alternatives(surrounding_text, full_code)
            
            course = {
                'id': full_code,
                'department': department,
                'number': number,
                'title': title,
                'credits': 3,  # Default to 3 credits for courses found in text
                'alternatives': alternatives
            }
            
            all_found_courses[full_code] = course
            found_courses.append(course)
    
    # Recursively search for courses in child elements
    for child in element.find_all(['div', 'table', 'tbody', 'tr'], recursive=False):
        child_courses = find_courses_in_element(child, all_found_courses)
        for course in child_courses:
            if course['id'] not in all_found_courses:
                all_found_courses[course['id']] = course
                found_courses.append(course)
    
    return found_courses

def extract_alternatives(text, main_course_code):
    """Extract alternative courses from text"""
    alternatives = []
    
    # Look for phrases like "or MATH 114" or "OR CS 112"
    # FIXED: removed [A-Z]? to prevent capturing title's first letter
    alt_matches = re.finditer(r'(?:or|OR)\s+([A-Z]{2,5})\s*(\d{3})', text)
    
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
        file_path: Path to the HTML file or HTML content string
        major: Major name
        
    Returns:
        Dictionary containing the parsed requirements
    """
    # Check if file_path is a file or HTML content
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
    else:
        html_content = file_path  # Assume file_path is HTML content
    
    # Parse the HTML content
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Extract program_id from file_path if it's a file
    program_id = ""
    if os.path.exists(file_path):
        program_id = os.path.basename(file_path).replace(".html", "")
    
    # Initialize the results structure
    results = {
        "degree_name": major if major else "",
        "total_credits": 120,  # Default to 120 credits for most bachelor's programs
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
    
    # Extract section headers and their associated tables
    headers = requirements_div.find_all(['h2', 'h3', 'h4'])
    print(f"Found {len(headers)} section headers")
    
    # Track all found courses to avoid duplicates
    all_found_courses = {}
    
    # Process each section
    for i, header in enumerate(headers):
        category_title = header.text.strip()
        category_title = re.sub(r'\s+', ' ', category_title).strip()
        print(f"Processing section: {category_title}")
        
        # Standardize category name
        category_title = standardize_category_name(category_title)
        
        # Skip categories that aren't core curriculum
        if is_excluded_category(category_title):
            continue
        
        # Find the next table after this header
        course_list = header.find_next('table', {'class': 'sc_courselist'})
        
        # Skip if no table found
        if not course_list:
            print(f"No course list found for {category_title}")
            continue
        
        # Extract courses from this list
        courses = []
        
        # Find all rows in the table except the header row
        rows = course_list.find_all('tr')
        for row in rows:
            # Skip header rows
            if row.find('th'):
                continue
            
            # Extract course information
            cells = row.find_all('td')
            
            # Skip rows that don't have enough cells
            if len(cells) < 2:
                continue
            
            code_cell = cells[0]
            title_cell = cells[1]
            credits_cell = cells[2] if len(cells) > 2 else None
            
            code_text = clean_course_code(code_cell.get_text())
            title_text = title_cell.get_text().strip()
            title_text = re.sub(r'\s+', ' ', title_text)
            credits_text = credits_cell.get_text().strip() if credits_cell else ""
            
            # Skip total rows
            if code_text.startswith('Total'):
                continue
            
            # Extract credits if available
            credits = 0
            if credits_text:
                # Try to extract a numeric value
                credits_match = re.search(r'(\d+)', credits_text)
                if credits_match:
                    credits = int(credits_match.group(1))
            
            # Parse department and number if possible
            code_match = re.match(r'([A-Z]+)[^\d]*(\d+)', code_text)
            if code_match:
                department = code_match.group(1)
                number = code_match.group(2)
                
                # Skip if we've already found this course
                if code_text in all_found_courses:
                    continue
                
                all_found_courses[code_text] = True
                
                # Extract alternatives
                alternatives = extract_alternatives(title_text, code_text)
                
                courses.append({
                    "id": code_text,
                    "department": department,
                    "number": number,
                    "title": title_text,
                    "credits": credits,
                    "alternatives": alternatives
                })
        
        # Add category to requirements if it has courses
        if courses:
            # Calculate total credits for this category
            total_credits = sum(course["credits"] for course in courses if course["credits"] > 0)
            
            results["categories"].append({
                "name": category_title,
                "total_credits": total_credits,
                "courses": courses
            })
    
    # If no categories were found, try the old method
    if not results["categories"]:
        print("No categories found with new method, trying legacy approach...")
        return legacy_parse_gmu_catalog(soup, major, program_id)
    
    print(f"Successfully parsed {len(results['categories'])} categories with courses")
    return results

def legacy_parse_gmu_catalog(soup, major, program_id):
    """Legacy implementation of parse_gmu_catalog to use as a fallback"""
    # Initialize the results structure
    results = {
        "degree_name": major if major else "",
        "total_credits": 120,
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
        # Skip concentration headers - they'll be handled separately
        if category_title.startswith('Concentration in'):
            continue
            
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
                courses.extend(find_courses_in_element(row, all_found_courses))
        
        # If no tables, look for courses in the text
        if not courses:
            courses.extend(find_courses_in_element(category_element, all_found_courses))
        
        # Only add categories with courses
        if courses:
            results["categories"].append({
                "name": category_title,
                "total_credits": credits_required,
                "courses": courses
            })
    
    print(f"Legacy method parsed {len(results['categories'])} categories with courses")
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
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to project root
    data_dir = os.path.join(project_root, "data", "majorRequirements")
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
                course_code = course['id'].replace(' ', '')  # Use 'id' instead of 'code'
                title = course['title'].replace("'", "''")  # Escape single quotes for SQL
                f.write(f"INSERT INTO courses (id, category_id, course_code, title, credits) VALUES ('{course_id}', '{category_id}', '{course_code}', '{title}', {course['credits']});\n")
    
    print(f"Results saved to {json_path} and {sql_path}")

def extract_concentrations(soup, program_id):
    """
    Extract concentration information from a program page
    
    Args:
        soup: BeautifulSoup object of the program page
        program_id: ID of the program
        
    Returns:
        List of Concentration objects with their categories and courses
    """
    concentrations = []
    
    # Find all concentration headers - they usually start with "Concentration in"
    concentration_headers = soup.find_all('h3', class_='toggle')
    
    for header in concentration_headers:
        header_text = header.text.strip()
        
        # Check if this is a concentration header
        if not header_text.startswith('Concentration in'):
            continue
            
        # Extract concentration name and ID
        concentration_name = header_text.replace('Concentration in', '').strip()
        # Extract ID from parentheses if available, e.g., "Concentration in Software Engineering (SWE)"
        concentration_id = None
        if '(' in concentration_name and ')' in concentration_name:
            start_idx = concentration_name.rfind('(')
            end_idx = concentration_name.rfind(')')
            if start_idx != -1 and end_idx != -1:
                concentration_id = concentration_name[start_idx+1:end_idx].strip()
                concentration_name = concentration_name[:start_idx].strip()
        
        # If ID not found in parentheses, create one from the name
        if not concentration_id:
            concentration_id = ''.join(c for c in concentration_name if c.isalnum())
        
        # Initialize concentration data
        concentration = {
            "id": concentration_id,
            "name": concentration_name,
            "total_credits": 0,  # Will calculate later
            "categories": []
        }
        
        # Find all category headers that follow this concentration header
        # Categories are usually h4 elements
        next_element = header.find_next_sibling()
        while next_element and next_element.name != 'h3':
            if next_element.name == 'h4':
                category_name = next_element.text.strip()
                category_total_credits = 0
                
                # Find the course table for this category
                course_table = next_element.find_next('table', class_='sc_courselist')
                if course_table:
                    courses = []
                    
                    # Extract courses from the table
                    course_rows = course_table.find_all('tr')
                    for row in course_rows:
                        # Find total credits for the category
                        if 'listsum' in row.get('class', []):
                            credits_cell = row.find('td', class_='hourscol')
                            if credits_cell and credits_cell.text.strip():
                                try:
                                    category_total_credits = float(credits_cell.text.strip())
                                except ValueError:
                                    # Handle ranges like "3-6" by taking the upper bound
                                    if '-' in credits_cell.text:
                                        upper_bound = credits_cell.text.split('-')[1].strip()
                                        try:
                                            category_total_credits = float(upper_bound)
                                        except ValueError:
                                            pass
                        
                        # Extract courses from regular rows
                        course_code_cell = row.find('td', class_='codecol')
                        if course_code_cell and not ('listsum' in row.get('class', [])):
                            # Find courses in this row
                            courses_in_row = find_courses_in_element(row)
                            courses.extend(courses_in_row)
                    
                    # Create category
                    if courses:
                        category = {
                            "name": category_name,
                            "total_credits": category_total_credits,
                            "courses": courses
                        }
                        concentration["categories"].append(category)
                        concentration["total_credits"] += category_total_credits
            
            next_element = next_element.find_next_sibling()
        
        # Add concentration to the list if it has categories
        if concentration["categories"]:
            concentrations.append(concentration)
    
    return concentrations

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