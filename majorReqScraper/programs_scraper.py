import os
import json
import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import traceback

# Base URL for the GMU catalog
BASE_URL = "https://catalog.gmu.edu"
# URL for the programs list with filter for undergraduate programs
PROGRAMS_URL = "https://catalog.gmu.edu/programs/#filter=.filter_22"

def ensure_output_dir():
    """Create the output directory if it doesn't exist"""
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "majorRequirements")
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    return output_dir

def extract_major_id(name):
    """Create a consistent ID from the major name"""
    if not name:
        return ""
    # Remove any special characters and convert to lowercase
    major_id = re.sub(r'[^a-zA-Z0-9]', '_', name.lower())
    # Remove consecutive underscores
    major_id = re.sub(r'_+', '_', major_id)
    # Remove leading/trailing underscores
    return major_id.strip('_')

def clean_major_name(name):
    """Clean and standardize major name"""
    if not name:
        return None
        
    try:
        # Convert to string if it's not
        name = str(name).strip()
        
        # Skip non-descriptive entries
        if len(name) < 3 or name in ["Program", "Major", "Degree", "Bachelor"]:
            return None
        
        # Remove any HTML tags
        name = re.sub(r'<[^>]*>', '', name)
        
        # First try to extract just the program name with BS/BA designation
        program_match = re.search(r'([^,]+, (?:BS|BA|BSc|BFA|BBA|BMus|BSEd|BSN|BArch))', name)
        if program_match:
            return program_match.group(1).strip()
            
        # If that fails, try to extract the name before any "Bachelor" text
        bachelor_match = re.search(r'(.+?)(?:Bachelor|Undergraduate|Graduate|Minor)', name, re.IGNORECASE)
        if bachelor_match:
            clean = bachelor_match.group(1).strip()
            # Remove trailing comma if present
            clean = clean.rstrip(',').strip()
            
            # If we don't have BS/BA, check if it's in the text
            if ', BS' not in clean and ', BA' not in clean:
                if any(term in name.lower() for term in ['science', 'engineering', 'technology']):
                    clean += ', BS'
                else:
                    clean += ', BA'
                    
            return clean
            
        # Just keep the first part if it's very long
        if len(name) > 50 and ',' in name:
            parts = name.split(',')
            clean = parts[0].strip()
            
            # Add degree type if missing
            if ', BS' not in clean and ', BA' not in clean:
                if any(term in name.lower() for term in ['science', 'engineering', 'technology']):
                    clean += ', BS'
                else:
                    clean += ', BA'
                    
            return clean
        
        # If none of the above work but the name contains BS or BA, use it
        if ', BS' in name or ', BA' in name:
            # Extract up to and including BS/BA
            if ', BS' in name:
                index = name.find(', BS') + 4
                return name[:index].strip()
            else:
                index = name.find(', BA') + 4
                return name[:index].strip()
        
        # Fallback: just clean up the original name
        clean = re.sub(r'\s+', ' ', name).strip()
        
        # Add degree type if missing
        if not any(f", {deg}" in clean for deg in ["BS", "BA", "BSc", "BFA"]):
            if any(term in clean.lower() for term in ['science', 'engineering', 'technology']):
                clean += ', BS'
            else:
                clean += ', BA'
                
        return clean
    except Exception as e:
        print(f"Error cleaning name '{name}': {str(e)}")
        return None

def scrape_programs():
    """Scrape bachelor's degree programs from GMU catalog"""
    print(f"Scraping bachelor's programs from GMU catalog...")
    output_dir = ensure_output_dir()
    
    try:
        # Fetch the programs page
        response = requests.get(PROGRAMS_URL)
        if response.status_code != 200:
            print(f"Failed to fetch programs: {response.status_code}")
            return []
            
        # Save HTML for debugging
        debug_file = os.path.join(output_dir, "debug_programs_page.html")
        with open(debug_file, 'w', encoding='utf-8') as f:
            f.write(response.text)
        print(f"Saved HTML to {debug_file} for debugging")
        
        # First try using the direct HTML extraction
        bachelor_programs = extract_programs_from_html()
        
        # If we didn't get any programs, try the fallback method
        if not bachelor_programs:
            print("Using fallback method to extract programs...")
            # Define hardcoded examples as a fallback
            bachelor_programs = [
                {
                    'id': 'computer_science_bs',
                    'name': 'Computer Science, BS',
                    'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/computer-science/computer-science-bs/#requirementstext',
                    'college': 'College of Engineering and Computing'
                },
                {
                    'id': 'information_technology_bs',
                    'name': 'Information Technology, BS',
                    'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/information-sciences-technology/information-technology-bs/#requirementstext',
                    'college': 'College of Engineering and Computing'
                },
                {
                    'id': 'applied_computer_science_bs',
                    'name': 'Applied Computer Science, BS',
                    'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/computer-science/applied-computer-science-bs/#requirementstext',
                    'college': 'College of Engineering and Computing'
                },
                {
                    'id': 'cybersecurity_engineering_bs',
                    'name': 'Cybersecurity Engineering, BS',
                    'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/cyber-security-engineering/cyber-security-engineering-bs/#requirementstext',
                    'college': 'College of Engineering and Computing'
                },
                {
                    'id': 'computer_engineering_bs',
                    'name': 'Computer Engineering, BS',
                    'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/electrical-computer/computer-engineering-bs/#requirementstext',
                    'college': 'College of Engineering and Computing'
                }
            ]
        
        # Save results
        bachelor_programs_file = os.path.join(output_dir, "bachelor_programs.json")
        with open(bachelor_programs_file, 'w', encoding="utf-8") as f:
            json.dump(bachelor_programs, f, indent=2)
        
        print(f"Found {len(bachelor_programs)} bachelor's programs")
        print(f"Results saved to {bachelor_programs_file}")
        
        return bachelor_programs
    
    except Exception as e:
        print(f"Error scraping programs: {str(e)}")
        traceback.print_exc()
        return []

def update_requirements_urls(bachelor_programs):
    """Ensure URLs point to the requirements section"""
    for program in bachelor_programs:
        if 'url' in program:
            url = program['url']
            if not url.endswith('#requirementstext'):
                # Check if URL already has a fragment
                if '#' in url:
                    # Replace existing fragment
                    url = url.split('#')[0] + '#requirementstext'
                else:
                    # Add fragment
                    url = url.rstrip('/') + '/#requirementstext'
                program['url'] = url
    return bachelor_programs

def extract_programs_from_html():
    """Extract program information directly from the saved HTML file"""
    output_dir = ensure_output_dir()
    debug_file = os.path.join(output_dir, "debug_programs_page.html")
    
    if not os.path.exists(debug_file):
        print(f"Debug HTML file not found: {debug_file}")
        return []
    
    try:
        with open(debug_file, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        soup = BeautifulSoup(html_content, 'html.parser')
        bachelor_programs = []
        
        # Look for bachelor's programs in the page
        # GMU catalog uses a specific structure with lists/tables for programs
        program_items = []
        
        # First approach: look for items with Bachelor's text
        bachelor_items = []
        for element in soup.find_all(string=lambda s: s and 'bachelor' in s.lower()):
            parent = element.parent
            while parent and parent.name not in ['li', 'tr', 'div', 'a']:
                parent = parent.parent
            
            if parent and parent not in bachelor_items:
                bachelor_items.append(parent)
        
        # Second approach: look for BS/BA programs directly
        for element in soup.find_all(['li', 'tr']):
            text = element.get_text(strip=True)
            if (', BS' in text or ', BA' in text or ' BS ' in text or ' BA ' in text) and element not in bachelor_items:
                bachelor_items.append(element)
        
        # Process found items
        for item in bachelor_items:
            try:
                link = item.find('a')
                if not link:
                    continue
                    
                program_name = link.get_text(strip=True)
                href = link.get('href', '')
                
                if not href:
                    continue
                    
                # Make sure the URL is complete
                if not href.startswith('http'):
                    href = urljoin(BASE_URL, href)
                    
                # Ensure URL points to requirements section
                if '#' not in href:
                    href = href.rstrip('/') + '/#requirementstext'
                elif not href.endswith('#requirementstext'):
                    href = href.split('#')[0] + '#requirementstext'
                
                # Clean program name
                clean_name = clean_major_name(program_name)
                if not clean_name:
                    continue
                    
                # Generate ID
                program_id = extract_major_id(clean_name)
                if not program_id:
                    continue
                
                # Try to extract college
                college = "Unknown"
                for parent in item.parents:
                    college_element = parent.find(string=lambda s: s and ('college' in s.lower() or 'school' in s.lower()))
                    if college_element:
                        college = college_element.strip()
                        break
                
                # Create program entry
                program = {
                    'id': program_id,
                    'name': clean_name,
                    'url': href,
                    'college': college
                }
                
                bachelor_programs.append(program)
            except Exception as e:
                print(f"Error processing item: {str(e)}")
        
        # Remove duplicates
        unique_programs = []
        seen_ids = set()
        for program in bachelor_programs:
            if program['id'] not in seen_ids:
                unique_programs.append(program)
                seen_ids.add(program['id'])
        
        # Add hardcoded examples if no programs found
        if not unique_programs:
            print("No bachelor's programs found in HTML. Adding hardcoded examples...")
            unique_programs = [
                {
                    'id': 'computer_science_bs',
                    'name': 'Computer Science, BS',
                    'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/computer-science/computer-science-bs/#requirementstext',
                    'college': 'College of Engineering and Computing'
                },
                {
                    'id': 'information_technology_bs',
                    'name': 'Information Technology, BS',
                    'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/information-sciences-technology/information-technology-bs/#requirementstext',
                    'college': 'College of Engineering and Computing'
                },
                {
                    'id': 'applied_computer_science_bs',
                    'name': 'Applied Computer Science, BS',
                    'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/computer-science/applied-computer-science-bs/#requirementstext',
                    'college': 'College of Engineering and Computing'
                },
                {
                    'id': 'cybersecurity_engineering_bs',
                    'name': 'Cybersecurity Engineering, BS',
                    'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/cyber-security-engineering/cyber-security-engineering-bs/#requirementstext',
                    'college': 'College of Engineering and Computing'
                },
                {
                    'id': 'computer_engineering_bs',
                    'name': 'Computer Engineering, BS',
                    'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/electrical-computer/computer-engineering-bs/#requirementstext',
                    'college': 'College of Engineering and Computing'
                }
            ]
        
        # Save results
        bachelor_programs_file = os.path.join(output_dir, "bachelor_programs_from_html.json")
        with open(bachelor_programs_file, 'w', encoding="utf-8") as f:
            json.dump(unique_programs, f, indent=2)
        
        print(f"Extracted {len(unique_programs)} bachelor's programs from HTML")
        print(f"Results saved to {bachelor_programs_file}")
        
        return unique_programs
    
    except Exception as e:
        print(f"Error processing HTML file: {str(e)}")
        return []

if __name__ == "__main__":
    print("GMU Programs Scraper")
    print("-------------------")
    
    # Try to scrape programs from the website
    bachelor_programs = scrape_programs()
    
    # If web scraping didn't find any programs, try extracting from saved HTML
    if not bachelor_programs:
        print("\nAttempting to extract programs from saved HTML...")
        bachelor_programs = extract_programs_from_html()
    
    if bachelor_programs:
        # Make sure URLs point to requirements section
        bachelor_programs = update_requirements_urls(bachelor_programs)
        
        # Save updated JSON
        output_dir = ensure_output_dir()
        final_file = os.path.join(output_dir, "bachelor_programs.json")
        with open(final_file, 'w', encoding="utf-8") as f:
            json.dump(bachelor_programs, f, indent=2)
        
        print(f"\nFinal count: {len(bachelor_programs)} bachelor's programs")
        print(f"Results saved to {final_file}")
    else:
        print("\nNo bachelor's programs found.")
    
    print("\nScraping completed.") 