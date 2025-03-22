from selenium import webdriver
from selenium.webdriver.common.by import By
import json
import time
import os

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

def scrape_courses(subject):
    """Scrape course information for a given subject"""
    
    driver = webdriver.Chrome()
    url = f'https://catalog.gmu.edu/courses/{subject.lower()}/'
    driver.get(url)
    
    print(f"\nWaiting for {subject} page to load...")
    time.sleep(3)
    
    courses = []
    try:
        # Updated JavaScript to get more course information
        script = """
        let courses = [];
        document.querySelectorAll('.courseblock').forEach(block => {
            let title = block.querySelector('.courseblocktitle');
            let desc = block.querySelector('.courseblockdesc');
            let extra = block.querySelector('.courseblockextra');
            
            if (title && desc) {
                // Get prerequisites - look for <p> elements containing "Prerequisite"
                let prereqs = '';
                let prereqElement = extra ? extra.querySelector('p[class*="prereq"]') : null;
                if (prereqElement) {
                    prereqs = prereqElement.textContent.replace('Prerequisite(s):', '').trim();
                }
                
                // Get corequisites - look for <p> elements containing "Corequisite"
                let coreqs = '';
                let coreqElement = extra ? extra.querySelector('p[class*="coreq"]') : null;
                if (coreqElement) {
                    coreqs = coreqElement.textContent.replace('Corequisite(s):', '').trim();
                }
                
                // Get notes - look for <p> elements containing "Notes"
                let notes = '';
                let notesElement = extra ? Array.from(extra.querySelectorAll('p')).find(p => p.textContent.startsWith('Notes:')) : null;
                if (notesElement) {
                    notes = notesElement.textContent.replace('Notes:', '').trim();
                }
                
                courses.push({
                    title: title.innerText,
                    description: desc.innerText,
                    prerequisites: prereqs,
                    corequisites: coreqs,
                    notes: notes
                });
            }
        });
        return courses;
        """
        
        course_data = driver.execute_script(script)
        print(f"Found {len(course_data)} {subject} courses")
        
        for data in course_data:
            try:
                title_text = data['title'].strip()
                
                # Split by colon to get code and rest
                code_part, rest = title_text.split(': ', 1)
                
                # Split rest by period to get title and credits
                title_credits = rest.rsplit('. ', 1)
                if len(title_credits) == 2:
                    title, credits_part = title_credits
                    
                    # Extract just the number from credits
                    credits = credits_part.split()[0]  # Takes first part of "3 credits."
                    
                    course = {
                        'Code': code_part.strip().replace('\u00a0', ' '),
                        'Title': title.strip(),
                        'Credits': credits.strip(),
                        'Description': data['description'].strip(),
                        'Prerequisites': data['prerequisites'],
                        'Corequisites': data['corequisites'],
                        'Notes': data['notes']
                    }
                    courses.append(course)
                    print(f"Successfully processed: {code_part} - {title}")
                    
            except Exception as e:
                print(f"Error processing course: {str(e)}")
                continue
                
    finally:
        driver.quit()
        
    return courses

def ensure_output_directory():
    """Create output directory if it doesn't exist"""
    if not os.path.exists('output'):
        os.makedirs('output')

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
        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S"),
        "subjects": all_courses
    }
    
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"\nSaved combined course data to {filename}")

def main():
    """Main function to run the scraper"""
    print("Starting course scraper...")
    
    # Create output directory
    ensure_output_directory()
    
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
    
    # Save combined file
    if all_courses:
        save_combined_courses(all_courses)
        print("\nAll subjects processed successfully!")
    else:
        print("\nNo courses found for any subject!")

if __name__ == "__main__":
    main()