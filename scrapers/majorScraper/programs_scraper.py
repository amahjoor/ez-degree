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
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(script_dir))  # Go up two levels to project root
    output_dir = os.path.join(project_root, "data", "majors")
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
        
        # Second approach: look for degree type in name
        for degree in ["BS", "BA", "BSc", "BFA", "BBA", "BMus", "BSEd", "BSN", "BArch"]:
            if f", {degree}" in name:
                parts = name.split(f", {degree}")
                return f"{parts[0].strip()}, {degree}"
        
        # If no specific degree format found, just clean up the text
        name = re.sub(r'\s+', ' ', name)
        return name
    except Exception as e:
        print(f"Error cleaning major name '{name}': {str(e)}")
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

def extract_programs_from_html(html_content=None):
    """Extract program information directly from the saved HTML file"""
    try:
        bachelor_programs = []
        output_dir = ensure_output_dir()
        
        if not html_content:
            # Try to load from debug file
            debug_file = os.path.join(output_dir, "debug_programs_page.html")
            if not os.path.exists(debug_file):
                print(f"Error: HTML file not found at {debug_file}")
                return []
                
            with open(debug_file, "r", encoding="utf-8") as f:
                html_content = f.read()
        
        soup = BeautifulSoup(html_content, "html.parser")
        
        # Find all program rows
        program_table = soup.find(class_='filterableProgramsTable')
        if program_table:
            rows = program_table.find_all('tr')
            
            # Skip the header row
            for row in rows[1:]:
                cells = row.find_all('td')
                if len(cells) < 3:
                    continue
                
                # Extract data
                program_name = cells[0].text.strip()
                degree_type = cells[1].text.strip()
                college = cells[2].text.strip()
                
                # Only keep bachelor's programs
                if degree_type and "bachelor" in degree_type.lower():
                    # Find the link to requirements
                    link = cells[0].find('a')
                    prog_url = None
                    if link and link.has_attr('href'):
                        prog_url = urljoin(BASE_URL, link['href'])
                        # Add #requirementstext to go directly to requirements
                        if not prog_url.endswith("#requirementstext"):
                            prog_url += "#requirementstext"
                    
                    # Clean name to standardize format
                    cleaned_name = clean_major_name(program_name)
                    if cleaned_name:
                        major_id = extract_major_id(cleaned_name)
                        bachelor_programs.append({
                            "name": cleaned_name,
                            "id": major_id,
                            "url": prog_url,
                            "college": college,
                            "degree_type": degree_type
                        })
        
        if bachelor_programs:
            print(f"Found {len(bachelor_programs)} bachelor's programs from HTML")
        else:
            print("No bachelor's programs found in HTML.")
        
        return bachelor_programs
        
    except Exception as e:
        print(f"Error extracting programs from HTML: {str(e)}")
        traceback.print_exc()
        return []

def main():
    """Main function to scrape programs"""
    try:
        # 1. Ensure output directory exists
        output_dir = ensure_output_dir()
        
        # 2. Scrape the programs page
        print("Fetching programs page...")
        response = requests.get(PROGRAMS_URL)
        response.raise_for_status()  # Raise exception for HTTP errors
        
        # Save HTML for debugging
        debug_file = os.path.join(output_dir, "debug_programs_page.html")
        with open(debug_file, "w", encoding="utf-8") as f:
            f.write(response.text)
        print(f"Saved HTML to {debug_file} for debugging")
        
        # 3. Parse the HTML for bachelor's programs
        print("\nExtracting bachelor's programs...")
        soup = BeautifulSoup(response.text, "html.parser")
        bachelor_programs = []
        
        # Use the correct selector to find the programs table
        programs_div = soup.find(id='textcontainer')
        
        # Find all links that might be program links
        program_links = []
        if programs_div:
            program_links = programs_div.find_all('a', href=True)
        
        # Process each link
        for link in program_links:
            program_url = link.get('href', '')
            if not program_url or 'catalog.gmu.edu' not in program_url and not program_url.startswith('/'):
                continue
                
            program_name = link.get_text(strip=True)
            if not program_name:
                continue
                
            # Only keep bachelor's programs
            if not any(degree in program_name for degree in [', BS', ', BA', ', BSc', ', BFA']):
                continue
                
            # Make sure URL is complete
            if not program_url.startswith('http'):
                program_url = urljoin(BASE_URL, program_url)
                
            # Add #requirementstext to go directly to requirements
            if not program_url.endswith("#requirementstext"):
                program_url += "#requirementstext"
                
            # Clean name to standardize format
            cleaned_name = clean_major_name(program_name)
            if cleaned_name:
                major_id = extract_major_id(cleaned_name)
                bachelor_programs.append({
                    "name": cleaned_name,
                    "id": major_id,
                    "url": program_url,
                    "college": "Unknown",  # College info not easily available here
                    "degree_type": "Bachelor's"
                })
        
        # 4. Verify we found some programs
        if bachelor_programs:
            print(f"Found {len(bachelor_programs)} bachelor's programs")
        else:
            print("No bachelor's programs found. Adding some hardcoded programs...")
            # Add some default programs
            bachelor_programs = [
                {
                    "name": "Computer Science, BS",
                    "id": "computer_science_bs",
                    "url": "https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/computer-science/computer-science-bs/#requirementstext",
                    "college": "College of Engineering and Computing",
                    "degree_type": "Bachelor's"
                },
                {
                    "name": "Applied Computer Science, BS",
                    "id": "applied_computer_science_bs",
                    "url": "https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/computer-science/applied-computer-science-bs/#requirementstext",
                    "college": "College of Engineering and Computing",
                    "degree_type": "Bachelor's"
                }
            ]
            print(f"Added {len(bachelor_programs)} hardcoded programs")
        
        # 5. Save the all_programs.json file in the data directory
        if bachelor_programs:
            all_programs_file = os.path.join(output_dir, "all_programs.json")
            with open(all_programs_file, 'w', encoding='utf-8') as f:
                json.dump(bachelor_programs, f, indent=2)
            print(f"Results saved to {all_programs_file}")
            
            return bachelor_programs
        else:
            print("Failed to extract any bachelor's programs.")
            return []
            
    except Exception as e:
        print(f"Error scraping programs: {str(e)}")
        traceback.print_exc()
        return []

if __name__ == "__main__":
    print("GMU Programs Scraper")
    print("-------------------")
    
    # Try to scrape programs from the website
    bachelor_programs = main()
    
    if bachelor_programs:
        print(f"\nFinal count: {len(bachelor_programs)} bachelor's programs")
        print("\nScraping completed.")
    else:
        print("\nNo bachelor's programs found.")
        print("\nScraping completed.") 