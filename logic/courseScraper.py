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

def ensure_directories():
    """Create output and html_files directories if they don't exist"""
    if not os.path.exists('output'):
        os.makedirs('output')
    if not os.path.exists('output/html_files'):
        os.makedirs('output/html_files')

def scrape_courses(subject):
    """Scrape course information for a given subject"""
    
    driver = webdriver.Chrome()
    url = f'https://catalog.gmu.edu/courses/{subject.lower()}/'
    driver.get(url)
    
    print(f"\nWaiting for {subject} page to load...")
    time.sleep(3)
    
    # Save the HTML content for debugging
    html_content = driver.page_source
    with open(f'output/html_files/{subject.lower()}_courses.html', 'w', encoding='utf-8') as html_file:
        html_file.write(html_content)
    
    courses = []
    try:
        # Updated JavaScript to get more course information
        script = """
        let courses = [];
        document.querySelectorAll('.courseblock').forEach(block => {
            let title = block.querySelector('.courseblocktitle');
            let desc = block.querySelector('.courseblockdesc');
            let extraBlocks = block.querySelectorAll('.courseblockextra');
            
            if (title && desc) {
                // Get prerequisites - improved to handle various formats
                let prereqs = '';
                
                // Check all courseblockextra divs for prerequisites
                if (extraBlocks && extraBlocks.length > 0) {
                    for (let extraBlock of extraBlocks) {
                        // Look for the prereq paragraph that contains "Required Prerequisites" or "Prerequisite(s)"
                        let prereqElement = extraBlock.querySelector('p.prereq');
                        if (prereqElement) {
                            let prereqText = prereqElement.textContent;
                            // Replace either "Required Prerequisites:" or "Prerequisite(s):"
                            if (prereqText.includes('Required Prerequisites:')) {
                                prereqs = prereqText.replace('Required Prerequisites:', '').trim();
                            } else if (prereqText.includes('Prerequisite(s):')) {
                                prereqs = prereqText.replace('Prerequisite(s):', '').trim();
                            }
                            
                            // If we found prerequisites, no need to check other blocks
                            if (prereqs) break;
                        }
                        
                        // Some courses have prerequisites directly in the Registration Restrictions section
                        if (!prereqs && extraBlock.textContent.includes('Registration Restrictions:')) {
                            let regText = extraBlock.textContent;
                            let prereqIndex = regText.indexOf('Required Prerequisites:');
                            if (prereqIndex !== -1) {
                                let endIndex = regText.indexOf('Students with', prereqIndex);
                                if (endIndex === -1) {
                                    endIndex = regText.indexOf('Schedule Type:', prereqIndex);
                                }
                                if (endIndex === -1) {
                                    endIndex = regText.length;
                                }
                                
                                if (endIndex > prereqIndex) {
                                    prereqs = regText.substring(prereqIndex + 'Required Prerequisites:'.length, endIndex).trim();
                                }
                            }
                        }
                    }
                }
                
                // Get corequisites - improved to handle various formats
                let coreqs = '';
                if (extraBlocks && extraBlocks.length > 0) {
                    for (let extraBlock of extraBlocks) {
                        let coreqElement = extraBlock.querySelector('p[class*="coreq"]');
                        if (coreqElement) {
                            if (coreqElement.textContent.includes('Corequisite(s):')) {
                                coreqs = coreqElement.textContent.replace('Corequisite(s):', '').trim();
                            } else if (coreqElement.textContent.includes('Required Corequisites:')) {
                                coreqs = coreqElement.textContent.replace('Required Corequisites:', '').trim();
                            }
                            
                            // If we found corequisites, no need to check other blocks
                            if (coreqs) break;
                        }
                    }
                }
                
                // Get notes
                let notes = '';
                if (extraBlocks && extraBlocks.length > 0) {
                    for (let extraBlock of extraBlocks) {
                        let notesText = extraBlock.textContent;
                        if (notesText.includes('Notes:')) {
                            let notesStart = notesText.indexOf('Notes:') + 'Notes:'.length;
                            let notesEnd = notesText.indexOf('Schedule Type:', notesStart);
                            if (notesEnd === -1) {
                                notesEnd = notesText.length;
                            }
                            
                            notes = notesText.substring(notesStart, notesEnd).trim();
                            // If we found notes, no need to check other blocks
                            if (notes) break;
                        }
                    }
                }
                
                // Get Mason Core info if available
                let masonCore = '';
                if (extraBlocks && extraBlocks.length > 0) {
                    for (let extraBlock of extraBlocks) {
                        if (extraBlock.textContent.includes('Mason Core:')) {
                            let masonText = extraBlock.textContent;
                            let masonStart = masonText.indexOf('Mason Core:') + 'Mason Core:'.length;
                            let masonEnd = masonText.indexOf('Registration Restrictions:', masonStart);
                            if (masonEnd === -1) {
                                masonEnd = masonText.indexOf('Schedule Type:', masonStart);
                            }
                            if (masonEnd === -1) {
                                masonEnd = masonText.length;
                            }
                            
                            masonCore = masonText.substring(masonStart, masonEnd).trim();
                            break;
                        }
                    }
                }
                
                courses.push({
                    title: title.innerText,
                    description: desc.innerText,
                    prerequisites: prereqs,
                    corequisites: coreqs,
                    notes: notes,
                    mason_core: masonCore
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
                        'Notes': data['notes'],
                        'Mason_Core': data.get('mason_core', '')
                    }
                    courses.append(course)
                    print(f"Successfully processed: {code_part} - {title}")
                    
            except Exception as e:
                print(f"Error processing course: {str(e)}")
                continue
                
    finally:
        driver.quit()
        
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
    print("Starting course scraper...")
    
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
    
    # Save combined file
    if all_courses:
        save_combined_courses(all_courses)
        print("\nAll subjects processed successfully!")
    else:
        print("\nNo courses found for any subject!")

if __name__ == "__main__":
    main()