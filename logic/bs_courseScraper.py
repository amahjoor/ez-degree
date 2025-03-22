import requests
from bs4 import BeautifulSoup
import json
import time
import os
import re

# List of subjects to scrape - add more as needed
SUBJECTS = [
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
    if not os.path.exists('output'):
        os.makedirs('output')
    if not os.path.exists('output/html_files'):
        os.makedirs('output/html_files')

def clean_text(text):
    """Clean up text by removing extra whitespace"""
    if not text:
        return ""
    return re.sub(r'\s+', ' ', text.strip())

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
    """Scrape course information for a given subject using BeautifulSoup"""
    url = f'https://catalog.gmu.edu/courses/{subject.lower()}/'
    print(f"\nRequesting {subject} courses from {url}...")
    
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to retrieve data: HTTP {response.status_code}")
        return []
    
    # Save the HTML content for debugging
    with open(f'output/html_files/{subject.lower()}_courses.html', 'w', encoding='utf-8') as html_file:
        html_file.write(response.text)
    
    # Parse the HTML
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find all course blocks
    course_blocks = soup.select('.courseblock')
    print(f"Found {len(course_blocks)} {subject} course blocks")
    
    courses = []
    for block in course_blocks:
        try:
            # Get the course title (code, name, credits)
            title_elem = block.select_one('.courseblocktitle')
            if not title_elem:
                continue
                
            title_text = clean_text(title_elem.get_text())
            
            # Split by colon to get code and rest
            if ': ' not in title_text:
                print(f"Skipping malformed title: {title_text}")
                continue
                
            code_part, rest = title_text.split(': ', 1)
            
            # Split rest by period to get title and credits
            if '. ' not in rest:
                print(f"Skipping malformed title-credits: {rest}")
                continue
                
            title_credits = rest.rsplit('. ', 1)
            if len(title_credits) != 2:
                continue
                
            title, credits_part = title_credits
            
            # Extract just the number from credits
            try:
                credits = credits_part.split()[0]  # Takes first part of "3 credits."
            except:
                print(f"Error extracting credits from: {credits_part}")
                credits = ""
            
            # Get the course description
            desc_elem = block.select_one('.courseblockdesc')
            description = clean_text(desc_elem.get_text()) if desc_elem else ""
            
            # Get prerequisites, corequisites, and notes from extra blocks
            prerequisites = ""
            corequisites = ""
            notes = ""
            mason_core = ""
            
            extra_blocks = block.select('.courseblockextra')
            for extra in extra_blocks:
                # Extract prerequisites if not already found
                if not prerequisites:
                    prereq = extract_prerequisites(extra)
                    if prereq:
                        prerequisites = prereq
                
                # Extract corequisites if not already found
                if not corequisites:
                    coreq = extract_corequisites(extra)
                    if coreq:
                        corequisites = coreq
                
                # Extract notes if not already found
                if not notes:
                    note = extract_notes(extra)
                    if note:
                        notes = note
                
                # Extract Mason Core if not already found
                if not mason_core:
                    core = extract_mason_core(extra)
                    if core:
                        mason_core = core
            
            # Create the course object
            course = {
                'Code': code_part.strip().replace('\u00a0', ' '),
                'Title': title.strip(),
                'Credits': credits.strip(),
                'Description': description,
                'Prerequisites': prerequisites,
                'Corequisites': corequisites,
                'Notes': notes,
                'Mason_Core': mason_core
            }
            
            courses.append(course)
            print(f"Successfully processed: {code_part} - {title}")
            
        except Exception as e:
            print(f"Error processing course: {str(e)}")
            continue
    
    return courses

def save_courses(subject, courses):
    """Save courses for a subject to its own JSON file"""
    filename = f"output/{subject.lower()}_courses.json"
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
    filename = "output/all_courses.json"
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
    ensure_directories()
    
    # Dictionary to store all courses by subject
    all_courses = {}
    
    # Scrape each subject
    for subject in SUBJECTS:
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
        print("\nAll subjects processed successfully!")
    else:
        print("\nNo courses found for any subject!")

if __name__ == "__main__":
    main() 