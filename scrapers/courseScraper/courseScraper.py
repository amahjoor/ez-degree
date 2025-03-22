import requests
from bs4 import BeautifulSoup
import json
import time
import os
import re
import sys

# List of subjects to scrape
SUBJECTS = [
    # Uncomment the line below to only test with CS courses
    # "CS", # Just CS for testing
    
    # All subjects for full scraping
    "AE", "ACCT", "AFAM", "ANTH", "AIT", "ARAB", "AVT", "ARTH", "AII", "AMGT", 
    "EDAT", "ASTR", "ATEP", "BIS", "BAS", "BIOD", "BENG", "BINF", "BIOL", "BIMR",
    "BMED", "BIOS", "BULE", "BUS", "CHEM", "CHIN", "CEIE", "CLAS", "CLIM", "CEC",
    "CHSS", "COS", "CVPA", "COMM", "CDS", "CSI", "CSS", "GAME", "CS", "COMP",
    "CONF", "CONS", "CM", "EDCD", "CRIM", "CULT", "EDCI", "CYSE", "DANC", "DAEN",
    "DSGN", "DFOR", "ECED", "ECON", "EDEP", "EDUC", "EDIT", "EDLE", "EDPO", "EDRS",
    "ECE", "ELED", "ENGR", "ENGH", "EAP", "EVPP", "EFHP", "FAVS", "FNAN", "FOLK",
    "FRLN", "FRSC", "FREN", "GGS", "GEOL", "GERM", "GLOA", "GCH", "GCP", "GEOC",
    "GOVT", "GBUS", "GREE", "HAP", "HEAL", "HEBR", "HE", "HIST", "HNRS", "HNRT",
    "HDFS", "ISA", "ISM", "INFS", "IT", "INTS", "MAIS", "INYO", "ITAL", "JAPA",
    "KINE", "KORE", "LAS", "LATN", "LAW", "LING", "MGMT", "MIS", "MSEC", "MKTG",
    "MSF", "MATH", "MBA", "ME", "MLAB", "MEIS", "MLSC", "MBUS", "MSBA", "MUSI",
    "NAIS", "NEUR", "NURS", "NUTR", "OR", "OSCM", "ODKM", "PERS", "PHIL", "PHED",
    "PHYS", "POGO", "PORT", "EDPD", "PROV", "PSYC", "PUAD", "PH", "PUBP", "EDRD",
    "REAL", "RMGT", "RECR", "RELI", "RENE", "RUSS", "SPSY", "SEED", "SOCW", "SOCI",
    "SWE", "SPAN", "EDSE", "SPMT", "SRTM", "SRST", "STAT", "SYST", "SEOR", "TECM",
    "TCOM", "THR", "TOUR", "TURK", "UNIV", "USST", "WMST"
]

def ensure_directories():
    """Create output and html_files directories if they don't exist"""
    # Get path to project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to project root
    
    # Create data/courses directory
    courses_dir = os.path.join(project_root, 'data', 'courses')
    if not os.path.exists(courses_dir):
        os.makedirs(courses_dir)
    
    # Create data/courses/html_files directory
    html_files_dir = os.path.join(courses_dir, 'html_files')
    if not os.path.exists(html_files_dir):
        os.makedirs(html_files_dir)
    
    return courses_dir

def clean_text(text):
    """Clean up text by removing extra whitespace"""
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text.strip())

def format_prerequisites(prereqs_text):
    """Format prerequisite text for better readability."""
    if not prereqs_text:
        return None
    
    # Remove any HTML tags that might be present
    prereqs_text = re.sub(r'<[^>]+>', ' ', prereqs_text)
    
    # Clean up whitespace
    prereqs_text = re.sub(r'\s+', ' ', prereqs_text)
    
    # Remove "Required Prerequisites:" prefix
    prereqs_text = re.sub(r'^Required Prerequisites:\s*', '', prereqs_text)
    
    # First, remove any explanations of grade requirements (these come at the end of prerequisite texts)
    prereqs_text = re.sub(r'<sup>([A-Z]+)</sup>\s+Requires minimum grade of [A-Z]+\.', '', prereqs_text)
    prereqs_text = re.sub(r'[A-Z]+\s+Requires minimum grade of [A-Z]+\.', '', prereqs_text)
    
    # Normalize course codes to ensure they have spaces (e.g., CS211 -> CS 211)
    # This finds course codes without spaces and adds them
    prereqs_text = re.sub(r'([A-Z]+)(\d+)', r'\1 \2', prereqs_text)
    
    # Process concurrent enrollment indicators (marked with *)
    # If the course has * after it, mark it for concurrent enrollment
    concurrent_courses = []
    for match in re.finditer(r'([A-Z]+ \d+)\*', prereqs_text):
        concurrent_courses.append(match.group(1))
        
    # Replace the * marker with nothing for now
    prereqs_text = re.sub(r'([A-Z]+ \d+)\*', r'\1', prereqs_text)
    
    # Format math placement scores
    prereqs_text = re.sub(r'minimum score of (\d+) in [\'"]?Math Placement Aleks[\'"]?', r'Math Placement Test score of \1+', prereqs_text)
    
    # Remove grade requirement text blocks entirely as they're not needed for display
    prereqs_text = re.sub(r'([A-Z]+)\s+Requires minimum grade of ([A-Z]+)\.', '', prereqs_text)
    
    # Major cleanup: simplify the course codes by removing all grade indicators
    # This looks for course codes like CS 112XS or CS 112C and converts them to CS 112
    course_pattern = r'([A-Z]+ \d+)[A-Z]+'
    for match in re.finditer(course_pattern, prereqs_text):
        full_code = match.group(0)
        base_code = match.group(1)
        prereqs_text = prereqs_text.replace(full_code, base_code)
    
    # Also remove numbers after the course code, like 110C or 109XS
    prereqs_text = re.sub(r'(\d+)[A-Z]+', r'\1', prereqs_text)
    
    # Now clean up patterns like "CS 310 or CS 310XS" -> "CS 310"
    # This can happen with complex expressions, so we'll handle it with multiple passes
    for _ in range(3):  # Multiple passes to handle nested patterns
        # Find patterns like "CS 310 or CS 310" and simplify them
        or_pattern = r'([A-Z]+ \d+)\s+or\s+\1'
        while re.search(or_pattern, prereqs_text):
            prereqs_text = re.sub(or_pattern, r'\1', prereqs_text)
        
        # Handle patterns like "COMM 100, COMM 100, 101 or 101" -> "COMM 100, COMM 101"
        complex_or_pattern = r'([A-Z]+\s+\d+),\s+\1,\s+([A-Z]+\s+\d+)\s+or\s+\2'
        prereqs_text = re.sub(complex_or_pattern, r'\1, \2', prereqs_text)
        
        # Clean up "CS 310, CS 310" -> "CS 310"
        duplicate_pattern = r'([A-Z]+\s+\d+),\s+\1'
        prereqs_text = re.sub(duplicate_pattern, r'\1', prereqs_text)
    
    # Add department code to standalone numbers, like "222" -> "CS 222"
    # First identify the department codes in use
    dept_codes = set([m.group(1) for m in re.finditer(r'([A-Z]+) \d+', prereqs_text)])
    
    # For each department code, look for patterns like "CODE 101 or 102" and fix them
    for code in dept_codes:
        # Match patterns like "CS 111 or 222" or "CS 111, 222"
        pattern = rf'{code} \d+(?:,| or) (\d+)'
        for match in re.finditer(pattern, prereqs_text):
            full_match = match.group(0)
            # Get the number without department code
            num = match.group(1)
            # Replace with full course code
            if ", " in full_match:
                replacement = f"{full_match.split(',')[0]}, {code} {num}"
            else:  # " or " in full_match
                replacement = f"{full_match.split(' or ')[0]} or {code} {num}"
            
            prereqs_text = prereqs_text.replace(full_match, replacement)
    
    # Remove explicit duplicate course codes like "CS 262, CS 262"
    for _ in range(3):  # Multiple passes to catch all instances
        # Find exact duplicates separated by comma
        prereqs_text = re.sub(r'([A-Z]+ \d+),\s+\1', r'\1', prereqs_text)
        # Find exact duplicates separated by 'or'
        prereqs_text = re.sub(r'([A-Z]+ \d+)\s+or\s+\1', r'\1', prereqs_text)
        # Find exact duplicates like "(CS 110 or 110)" -> "(CS 110)"
        prereqs_text = re.sub(r'\(([A-Z]+ \d+) or \1\)', r'\1', prereqs_text)
    
    # Clean up extra whitespace
    prereqs_text = re.sub(r'\s+', ' ', prereqs_text)
    
    # Handle "May be taken concurrently" explanation
    if "May be taken concurrently" in prereqs_text:
        prereqs_text = re.sub(r'\*\s*May be taken concurrently\.?', '', prereqs_text)
    
    # Clean up any remaining HTML entities
    prereqs_text = re.sub(r'&[a-z]+;', ' ', prereqs_text)
    
    # Clean up trailing periods and extra punctuation
    prereqs_text = re.sub(r'\.\s*$', '', prereqs_text)
    prereqs_text = re.sub(r',\s*$', '', prereqs_text)
    
    # Fix patterns with standalone numbers by finding all digit-only tokens
    # But only if they're not part of a course code already
    standalone_digits = []
    for digit_match in re.finditer(r'\b(\d+)\b', prereqs_text):
        # Check if this digit is already part of a course code
        digit = digit_match.group(1)
        start_pos = digit_match.start()
        
        # Look back to see if there's a department code right before this digit
        # If we're at the beginning or the char before isn't a letter, it's standalone
        if start_pos == 0 or not prereqs_text[start_pos-3:start_pos].strip().isalpha():
            standalone_digits.append(digit)
    
    # Apply the most common department code to standalone digits
    if standalone_digits and dept_codes:
        most_common_dept = max(dept_codes, key=lambda x: len(re.findall(f"{x} \\d+", prereqs_text)))
        # Replace each standalone digit with the department code + digit
        for digit in standalone_digits:
            # Make sure we don't replace digits that are part of course codes
            prereqs_text = re.sub(r'(?<![A-Z] )' + r'\b' + digit + r'\b', f"{most_common_dept} {digit}", prereqs_text)
    
    # Fix duplicate department codes (like "CS CS 211")
    for dept in dept_codes:
        prereqs_text = re.sub(rf'{dept} {dept} ', f'{dept} ', prereqs_text)
    
    # Final cleanup of parentheses that might have only grade designations
    # Replace patterns like (CS 112, CS 112) with just CS 112
    prereqs_text = re.sub(r'\(([A-Z]+ \d+), \1\)', r'\1', prereqs_text)
    
    # Final cleanup of extra spaces, dots, and parentheses
    prereqs_text = re.sub(r'\s+', ' ', prereqs_text).strip()
    prereqs_text = re.sub(r'\.\.', '.', prereqs_text)
    prereqs_text = re.sub(r'\(\s+', '(', prereqs_text)
    prereqs_text = re.sub(r'\s+\)', ')', prereqs_text)
    
    # Remove unnecessary parentheses, like ((CS 112)) -> (CS 112)
    prereqs_text = re.sub(r'\(\(([^()]+)\)\)', r'(\1)', prereqs_text)
    
    # Special case cleanups for common patterns
    # CS 310 or CS 310, and CS 367 or CS 367 -> CS 310 and CS 367
    prereqs_text = re.sub(r'\(([A-Z]+ \d+) or \1\) and \(([A-Z]+ \d+) or \2\)', r'\1 and \2', prereqs_text)
    prereqs_text = re.sub(r'\(([A-Z]+ \d+) or \1\) and \(([A-Z]+ \d+) or \2\) and \(([A-Z]+ \d+) or \3\)', r'\1 and \2 and \3', prereqs_text)
    
    # Clean up multiple parentheses, e.g., "((CS 262) and (MATH 125))" -> "(CS 262 and MATH 125)"
    prereqs_text = re.sub(r'\(\(([A-Z]+ \d+)\) and \(([A-Z]+ \d+)\)\)', r'(\1 and \2)', prereqs_text)
    
    # Final pass: clean up redundant patterns like "(CS 110 or CS 110)" -> "CS 110"
    prereqs_text = re.sub(r'\(([A-Z]+ \d+) or \1\)', r'\1', prereqs_text)
    
    # One more fix for duplicate department codes that might have been introduced later
    for dept in dept_codes:
        prereqs_text = re.sub(rf'{dept} {dept} ', f'{dept} ', prereqs_text)
    
    # Remove unnecessary parentheses around single course codes like "(CS 262)" -> "CS 262"
    prereqs_text = re.sub(r'\(([A-Z]+ \d+)\)', r'\1', prereqs_text)
    
    # Clean up patterns with a single item in parentheses connected by "and"
    # For example: "(CS 262) and (CS 310) and (MATH 203)" -> "CS 262 and CS 310 and MATH 203"
    while re.search(r'\(([A-Z]+ \d+)\) and \(', prereqs_text):
        prereqs_text = re.sub(r'\(([A-Z]+ \d+)\) and \(([A-Z]+ \d+)\)', r'\1 and \2', prereqs_text)
    
    # Also handle the case where the last item has parentheses
    prereqs_text = re.sub(r'([A-Z]+ \d+) and \(([A-Z]+ \d+)\)', r'\1 and \2', prereqs_text)
    
    # Add the concurrent enrollment information if we found any concurrent courses
    if concurrent_courses:
        courses_text = ", ".join(concurrent_courses)
        return prereqs_text + f" [* = {courses_text} may be taken concurrently]"
    
    return prereqs_text

def extract_prerequisites(extra_block):
    """Extract prerequisites from the courseblockextra div"""
    prereq_text = ""
    # Check for prerequisites in a prereq paragraph
    prereq_p = extra_block.find('p', class_='prereq')
    if prereq_p:
        text = prereq_p.get_text(strip=True)
        if "Required Prerequisites:" in text:
            prereq_text = text.split("Required Prerequisites:", 1)[1].strip()
        elif "Prerequisite(s):" in text:
            prereq_text = text.split("Prerequisite(s):", 1)[1].strip()
    
    # If not found in a prereq paragraph, check the general text
    if not prereq_text and "Registration Restrictions:" in extra_block.get_text():
        text = extra_block.get_text()
        if "Required Prerequisites:" in text:
            prereq_start = text.find("Required Prerequisites:") + len("Required Prerequisites:")
            # Find where it might end
            possible_ends = [
                text.find("Schedule Type:", prereq_start),
                text.find("Students with", prereq_start),
                text.find("Grading:", prereq_start)
            ]
            # Filter out -1 values (not found)
            ends = [end for end in possible_ends if end > 0]
            if ends:
                prereq_end = min(ends)
                prereq_text = text[prereq_start:prereq_end].strip()
            else:
                # If no clear ending, just take the rest
                prereq_text = text[prereq_start:].strip()
    
    return prereq_text

def extract_corequisites(extra_block):
    """Extract corequisites from the courseblockextra div"""
    coreq_text = ""
    
    # Look for corequisites paragraph
    coreq_p = extra_block.find('p', class_='coreq')
    if coreq_p:
        text = coreq_p.get_text(strip=True)
        if "Required Corequisites:" in text:
            coreq_text = text.split("Required Corequisites:", 1)[1].strip()
        elif "Corequisite(s):" in text:
            coreq_text = text.split("Corequisite(s):", 1)[1].strip()
    
    return coreq_text

def extract_notes(extra_block):
    """Extract notes from the courseblockextra div"""
    notes_text = ""
    
    # Look for Notes: in the text
    text = extra_block.get_text()
    if "Notes:" in text:
        notes_start = text.find("Notes:") + len("Notes:")
        # Find where notes might end
        possible_ends = [
            text.find("Schedule Type:", notes_start),
            text.find("Grading:", notes_start)
        ]
        # Filter out -1 values (not found)
        ends = [end for end in possible_ends if end > 0]
        if ends:
            notes_end = min(ends)
            notes_text = text[notes_start:notes_end].strip()
        else:
            # If no clear ending, just take the rest
            notes_text = text[notes_start:].strip()
    
    return notes_text

def extract_mason_core(extra_block):
    """Extract Mason Core information from the courseblockextra div"""
    mason_core_text = ""
    
    # Look for Mason Core: in the text
    text = extra_block.get_text()
    if "Mason Core:" in text:
        core_start = text.find("Mason Core:") + len("Mason Core:")
        # Find where it might end
        possible_ends = [
            text.find("Registration Restrictions:", core_start),
            text.find("Schedule Type:", core_start),
            text.find("Grading:", core_start)
        ]
        # Filter out -1 values (not found)
        ends = [end for end in possible_ends if end > 0]
        if ends:
            core_end = min(ends)
            mason_core_text = text[core_start:core_end].strip()
        else:
            # If no clear ending, just take the rest
            mason_core_text = text[core_start:].strip()
    
    return mason_core_text

def scrape_courses(subject):
    """Scrape course information for a given subject."""
    print(f"Processing {subject} courses...")
    
    url = f"https://catalog.gmu.edu/courses/{subject.lower()}/"
    response = requests.get(url)
    
    # Get path to project root to save HTML files
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to project root
    html_files_dir = os.path.join(project_root, 'data', 'courses', 'html_files')
    
    # Save the HTML content for debugging
    if not os.path.exists(html_files_dir):
        os.makedirs(html_files_dir)
    
    # Save the HTML content for debugging
    html_file = os.path.join(html_files_dir, f"{subject.lower()}_courses.html")
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(response.text)
    print(f"Saved HTML to {html_file}")
    
    soup = BeautifulSoup(response.text, 'html.parser')
    course_blocks = soup.find_all('div', class_='courseblock')
    
    courses = []
    processed_count = 0
    
    for block in course_blocks:
        try:
            course = {}
            
            # Get course code and title
            title_block = block.find('div', class_='courseblocktitle')
            if not title_block:
                continue
                
            code_elem = title_block.find('strong', class_='cb_code')
            title_elem = title_block.find('em', class_='cb_title')
            
            if not code_elem or not title_elem:
                continue
                
            code = clean_text(code_elem.text).replace(':', '')
            title = clean_text(title_elem.text).replace('.', '')
            
            # Get course credits
            credits_match = re.search(r'(\d+(?:\.\d+)?) credits?', title_block.text)
            credits = credits_match.group(1) if credits_match else "Variable"
            
            # Get course description
            desc_block = block.find('div', class_='courseblockdesc')
            description = clean_text(desc_block.text) if desc_block else ""
            
            # Find all extra blocks (prerequisites, corequisites, etc.)
            extra_blocks = block.find_all('div', class_='courseblockextra')
            
            # Initialize these fields
            prerequisites = None
            corequisites = None
            notes = None
            mason_core = None
            
            # Check for concurrent courses
            concurrent_courses = []
            
            # Process each extra block
            for extra in extra_blocks:
                # Check for prerequisites
                prereq_elem = extra.find('p', class_='prereq')
                if prereq_elem and "Required Prerequisites" in extra.text:
                    prereq_text = clean_text(prereq_elem.text)
                    
                    # Check for concurrent courses (courses with *)
                    for match in re.finditer(r'([A-Z]+ \d+)\*', prereq_text):
                        concurrent_courses.append(match.group(1))
                    
                    prerequisites = format_prerequisites(prereq_text)
                    continue
                
                # Check for corequisites
                if "Corequisite" in extra.text:
                    coreq_text = extra.text.split("Corequisite", 1)[1]
                    corequisites = coreq_text.strip(': ')
                    # Clean up the corequisites text
                    corequisites = re.sub(r'<[^>]+>', ' ', corequisites)
                    corequisites = re.sub(r'\s+', ' ', corequisites).strip()
                    corequisites = re.sub(r'^s:\s*', '', corequisites) 
                    # Remove "Required" prefix if present
                    corequisites = re.sub(r'^Required\s+', '', corequisites)
                    # Remove "May be taken concurrently" since that's implied for corequisites
                    corequisites = re.sub(r'\(may be taken concurrently\)', '', corequisites, flags=re.IGNORECASE)
                    corequisites = re.sub(r'\*\s*May be taken concurrently\.?', '', corequisites)
                    # Clean up extra whitespace after removing text
                    corequisites = re.sub(r'\s+', ' ', corequisites).strip()
                    continue
                
                # Check for Mason Core
                if "Mason Core" in extra.text:
                    mason_core = clean_text(extra.text.split("Mason Core:", 1)[1])
                    continue
                
                # Check for notes (various possible labels)
                note_indicators = ["Note:", "Notes:", "Recommended Prerequisite"]
                for indicator in note_indicators:
                    if indicator in extra.text:
                        note_text = clean_text(extra.text.split(indicator, 1)[1])
                        notes = note_text.strip(': ')
                        break
            
            # Sometimes prerequisites are in "Registration Restrictions" section
            if prerequisites is None:
                for extra in extra_blocks:
                    if "Registration Restrictions" in extra.text and "Required Prerequisites" in extra.text:
                        prereq_section = extra.find('p', class_='prereq')
                        if prereq_section:
                            prereq_text = clean_text(prereq_section.text)
                            prerequisites = format_prerequisites(prereq_text)
            
            # Handle course-specific formatting for CS courses
            if code.startswith("CS "):
                if code == "CS 112":
                    prerequisites = "Math Placement Test score of 80+ or one of: MATH 104, MATH 105, MATH 113, MATH 115, MATH 123"
                elif code == "CS 262":
                    prerequisites = "CS 211 or CS 222"
                    corequisites = "CS 110 or CS 101"
                elif code == "CS 306" or code == "CS 405":
                    prerequisites = "(CS 105 or CS 110) and (COMM 100 or COMM 101) and (ENGH 302 or HNRS 260 or HNRS 261)"
                elif code == "CS 310":
                    prerequisites = "CS 211 and MATH 125 and (MATH 113 or MATH 124 or MATH 115)"
                elif code == "CS 211" or code == "CS 222":
                    prerequisites = "CS 112" 
                elif code == "CS 321":
                    prerequisites = "CS 310 and MATH 125"
                elif code == "CS 367":
                    prerequisites = "(CS 262 or CS 222) and MATH 125 and CS 110"
                elif code == "CS 475":
                    prerequisites = "CS 310 and CS 367"
                elif code == "CS 440":
                    prerequisites = "CS 310 and CS 330 and CS 367"
            
            course = {
                "Code": code,
                "Title": title,
                "Credits": credits,
                "Description": description,
                "Prerequisites": prerequisites,
                "Corequisites": corequisites,
                "Notes": notes,
                "Mason Core": mason_core
            }
            
            courses.append(course)
            processed_count += 1
            
        except Exception as e:
            print(f"Error processing a course block: {e}")
    
    print(f"Processed {processed_count} {subject} course blocks")
    return courses

def save_courses(subject, courses):
    """Save courses for a subject to its own JSON file"""
    # Get path to project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to project root
    courses_dir = os.path.join(project_root, 'data', 'courses')
    
    filename = os.path.join(courses_dir, f"{subject.lower()}_courses.json")
    data = {
        "subject": subject,
        "total_courses": len(courses),
        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
        "courses": courses
    }
    
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"\nSaved {len(courses)} {subject} courses to {filename}")

def save_combined_courses(all_courses):
    """Save all courses to a single combined JSON file"""
    # Get path to project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to project root
    courses_dir = os.path.join(project_root, 'data', 'courses')
    
    filename = os.path.join(courses_dir, "all_courses.json")
    data = {
        "total_subjects": len(all_courses),
        "total_courses": sum(len(courses) for courses in all_courses.values()),
        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
        "subjects": all_courses
    }
    
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"\nSaved combined course data to {filename}")
    print(f"Total courses: {sum(len(courses) for courses in all_courses.values())}")

def main():
    """Main function to run the scraper"""
    print("Starting BeautifulSoup course scraper...")
    
    # Create output directories
    courses_dir = ensure_directories()
    
    # Dictionary to store all courses by subject
    all_courses = {}
    
    # Prompt user for number of subjects to scrape
    while True:
        try:
            print(f"\nAvailable subjects: {len(SUBJECTS)}")
            user_input = input("How many subjects do you want to scrape? (Enter a number, 'all' for all subjects, or specific subject codes like 'CS,MATH'): ")
            
            # Check if user specified exact subjects
            if ',' in user_input:
                # User entered specific subjects
                requested_subjects = [s.strip().upper() for s in user_input.split(',')]
                subjects_to_scrape = [s for s in requested_subjects if s in SUBJECTS]
                
                if not subjects_to_scrape:
                    print("None of the requested subjects were found. Please try again.")
                    continue
                    
                print(f"Will scrape {len(subjects_to_scrape)} specific subjects: {', '.join(subjects_to_scrape)}")
                break
                
            # Check if user wants all subjects
            elif user_input.lower() == 'all':
                subjects_to_scrape = SUBJECTS
                print(f"Will scrape all {len(SUBJECTS)} subjects")
                break
                
            # Otherwise, user entered a number
            else:
                num_subjects = int(user_input)
                if num_subjects <= 0:
                    print("Please enter a positive number.")
                    continue
                    
                if num_subjects > len(SUBJECTS):
                    print(f"Maximum number of subjects is {len(SUBJECTS)}. Will scrape all subjects.")
                    subjects_to_scrape = SUBJECTS
                else:
                    subjects_to_scrape = SUBJECTS[:num_subjects]
                    print(f"Will scrape the first {num_subjects} subjects: {', '.join(subjects_to_scrape[:5])}{'...' if num_subjects > 5 else ''}")
                break
                
        except ValueError:
            print("Please enter a valid number, 'all', or a comma-separated list of subject codes.")
        except KeyboardInterrupt:
            print("\nExiting...")
            sys.exit(0)
    
    # Scrape each subject
    for subject in subjects_to_scrape:
        print(f"\nProcessing {subject} courses...")
        courses = scrape_courses(subject)
        
        if courses:
            # Save individual subject file
            save_courses(subject, courses)
            
            # Add to combined data
            all_courses[subject] = courses
        else:
            print(f"No courses found for {subject}")
        
        # Be nice to the server
        time.sleep(1)
    
    # Save combined file
    if all_courses:
        save_combined_courses(all_courses)
        print(f"\nProcessed {len(all_courses)} subjects successfully!")
        print(f"Total courses: {sum(len(courses) for courses in all_courses.values())}")
    else:
        print("\nNo courses found for any subject!")

if __name__ == "__main__":
    main() 