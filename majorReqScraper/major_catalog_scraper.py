import os
import json
import re
import requests
from bs4 import BeautifulSoup
import time
from urllib.parse import urljoin, urlparse

# Base URL for the GMU catalog
BASE_URL = "https://catalog.gmu.edu"
# URL for the list of all undergraduate degrees
CATALOG_URL = "https://catalog.gmu.edu/colleges-schools/"

# Output directory
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "majorRequirements")

def ensure_output_dir():
    """Create the output directory if it doesn't exist"""
    if not os.path.exists(OUTPUT_DIR):
        os.makedirs(OUTPUT_DIR)
    return OUTPUT_DIR

def extract_major_id(url):
    """Extract a usable ID from the major URL"""
    # Parse the URL path
    path = urlparse(url).path
    
    # Extract the last part of the path (e.g., 'computer-science-bs')
    major_part = path.split('/')[-2] if path.endswith('/') else path.split('/')[-1]
    
    # Clean up the ID
    major_id = re.sub(r'[^a-zA-Z0-9]', '_', major_part).lower()
    
    # If it ends with '_' (from trailing slash), remove it
    if major_id.endswith('_'):
        major_id = major_id[:-1]
        
    return major_id

def clean_major_name(name):
    """Clean and format major names for consistency"""
    if not name:
        return ""
    
    # Remove excessive whitespace
    name = re.sub(r'\s+', ' ', name.strip())
    
    # Remove common prefixes/suffixes
    name = re.sub(r'^(Bachelor of Arts in|Bachelor of Science in|BA in|BS in|BA|BS)', '', name, flags=re.IGNORECASE).strip()
    
    # Add BS or BA suffix if not present but the program is a bachelor's
    if 'bachelor of science' in name.lower() and not name.lower().endswith(' bs'):
        name = re.sub(r'Bachelor of Science( in)?', '', name, flags=re.IGNORECASE).strip() + ' BS'
    elif 'bachelor of arts' in name.lower() and not name.lower().endswith(' ba'):
        name = re.sub(r'Bachelor of Arts( in)?', '', name, flags=re.IGNORECASE).strip() + ' BA'
    
    # If no "BS" or "BA" suffix, check content
    if not any(suffix in name for suffix in [' BS', ' BA']):
        if any(term in name.lower() for term in ['science', 'computer', 'engineering', 'technology', 'mathematics', 'physics']):
            name = name + ' BS'
        elif any(term in name.lower() for term in ['arts', 'english', 'history', 'philosophy']):
            name = name + ' BA'
    
    return name

def get_college_urls():
    """Get URLs for all colleges/schools from the catalog"""
    print(f"Retrieving colleges/schools from {CATALOG_URL}")
    response = requests.get(CATALOG_URL)
    if response.status_code != 200:
        print(f"Error: Failed to retrieve catalog page. Status code: {response.status_code}")
        return []
    
    soup = BeautifulSoup(response.text, 'html.parser')
    colleges = []
    
    # Save the HTML for debugging
    with open("debug_colleges_page.html", "w") as f:
        f.write(response.text)
    
    # Try different selectors to find the college links
    # First try direct links in the list
    college_links = soup.select('div.sitemap ul li a')
    
    if not college_links:
        # Try alternative selectors
        college_links = soup.select('a[href*="/colleges-schools/"]')
    
    if not college_links:
        # Try finding all links and filter
        all_links = soup.find_all('a')
        college_links = [link for link in all_links if '/colleges-schools/' in link.get('href', '')]
    
    # Process found links
    for link in college_links:
        href = link.get('href', '')
        # Skip the main colleges page and any non-college pages
        if href == CATALOG_URL or '/colleges-schools/' not in href:
            continue
            
        college_name = link.text.strip()
        college_url = urljoin(BASE_URL, href)
        
        # Skip duplicate entries
        if any(c['url'] == college_url for c in colleges):
            continue
            
        colleges.append({
            'name': college_name,
            'url': college_url
        })
    
    # If still no colleges found, use a hardcoded list of URLs
    if not colleges:
        print("Could not find college links automatically. Using hardcoded list.")
        hardcoded_colleges = [
            {"name": "College of Engineering and Computing", "url": "https://catalog.gmu.edu/colleges-schools/engineering-computing/"},
            {"name": "College of Humanities and Social Sciences", "url": "https://catalog.gmu.edu/colleges-schools/humanities-social-sciences/"},
            {"name": "College of Science", "url": "https://catalog.gmu.edu/colleges-schools/science/"},
            {"name": "College of Visual and Performing Arts", "url": "https://catalog.gmu.edu/colleges-schools/visual-performing-arts/"},
            {"name": "College of Education and Human Development", "url": "https://catalog.gmu.edu/colleges-schools/education-human-development/"},
            {"name": "College of Public Health", "url": "https://catalog.gmu.edu/colleges-schools/health-human-services/"},
            {"name": "Schar School of Policy and Government", "url": "https://catalog.gmu.edu/colleges-schools/policy-government/"},
            {"name": "School of Business", "url": "https://catalog.gmu.edu/colleges-schools/business/"}
        ]
        colleges = hardcoded_colleges
    
    print(f"Found {len(colleges)} colleges/schools")
    return colleges

def get_majors_from_college(college_url, college_name):
    """Extract all bachelor's degree programs from a college page"""
    print(f"Retrieving programs from {college_name}")
    response = requests.get(college_url)
    if response.status_code != 200:
        print(f"Error: Failed to retrieve college page. Status code: {response.status_code}")
        return []
    
    soup = BeautifulSoup(response.text, 'html.parser')
    majors = []
    
    # Save the HTML for debugging
    debug_filename = f"debug_{college_name.lower().replace(' ', '_')}.html"
    with open(debug_filename, "w") as f:
        f.write(response.text)
    
    # Method 1: Look for program blocks
    program_items = soup.select('.sitemap li')
    for item in program_items:
        links = item.find_all('a')
        for link in links:
            href = link.get('href', '')
            if 'requirements' in href.lower() and href.lower().endswith(('#requirementstext', '#degreerequirementstext')):
                major_name = clean_major_name(link.text)
                major_url = urljoin(BASE_URL, href)
                major_id = extract_major_id(major_url)
                
                if "bachelor" in major_name.lower() or " bs" in major_name.lower() or " ba" in major_name.lower():
                    majors.append({
                        'id': major_id,
                        'name': major_name,
                        'url': major_url,
                        'college': college_name
                    })
                    print(f"  Found major: {major_name}")
    
    # Method 2: Look for bachelor's section and then programs
    if len(majors) == 0:
        print("No majors found with Method 1, trying Method 2...")
        bachelor_headings = []
        for heading in soup.find_all(['h2', 'h3']):
            if "bachelor" in heading.text.lower() or "undergraduate" in heading.text.lower():
                bachelor_headings.append(heading)
        
        for heading in bachelor_headings:
            # Find all links after this heading until the next heading
            current = heading.next_sibling
            while current and not (hasattr(current, 'name') and current.name in ['h2', 'h3']):
                if hasattr(current, 'find_all'):
                    for link in current.find_all('a'):
                        href = link.get('href', '')
                        if 'requirements' in href.lower():
                            major_name = clean_major_name(link.text)
                            major_url = urljoin(BASE_URL, href)
                            major_id = extract_major_id(major_url)
                            
                            if "bachelor" in major_name.lower() or " bs" in major_name.lower() or " ba" in major_name.lower():
                                majors.append({
                                    'id': major_id,
                                    'name': major_name,
                                    'url': major_url,
                                    'college': college_name
                                })
                                print(f"  Found major: {major_name}")
                current = current.next_sibling
    
    # Method 3: Search all links with "requirements" in the URL
    if len(majors) == 0:
        print("No majors found with Method 2, trying Method 3...")
        all_links = soup.find_all('a')
        for link in all_links:
            href = link.get('href', '')
            if 'requirements' in href.lower() and href.lower().endswith(('#requirementstext', '#degreerequirementstext')):
                major_name = clean_major_name(link.text)
                if len(major_name) > 0 and ("bachelor" in major_name.lower() or " bs" in major_name.lower() or " ba" in major_name.lower()):
                    major_url = urljoin(BASE_URL, href)
                    major_id = extract_major_id(major_url)
                    
                    # Skip duplicates
                    if any(m['url'] == major_url for m in majors):
                        continue
                    
                    majors.append({
                        'id': major_id,
                        'name': major_name,
                        'url': major_url,
                        'college': college_name
                    })
                    print(f"  Found major: {major_name}")
    
    # If we couldn't find any majors, try hardcoded ones for known colleges
    if len(majors) == 0 and "Engineering and Computing" in college_name:
        print("No majors found for Engineering college, using hardcoded list...")
        hardcoded_majors = [
            {
                'id': 'computer_science_bs',
                'name': 'Computer Science BS',
                'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/computer-science/computer-science-bs/#requirementstext',
                'college': college_name
            },
            {
                'id': 'information_technology_bs',
                'name': 'Information Technology BS',
                'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/information-sciences-technology/information-technology-bs/#requirementstext',
                'college': college_name
            },
            {
                'id': 'applied_computer_science_bs',
                'name': 'Applied Computer Science BS',
                'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/computer-science/applied-computer-science-bs/#requirementstext',
                'college': college_name
            },
            {
                'id': 'cybersecurity_engineering_bs',
                'name': 'Cybersecurity Engineering BS',
                'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/cyber-security-engineering/cyber-security-engineering-bs/#requirementstext',
                'college': college_name
            },
            {
                'id': 'computer_engineering_bs',
                'name': 'Computer Engineering BS',
                'url': 'https://catalog.gmu.edu/colleges-schools/engineering-computing/electrical-computer/computer-engineering-bs/#requirementstext',
                'college': college_name
            }
        ]
        majors = hardcoded_majors
    
    print(f"Found {len(majors)} majors in {college_name}")
    return majors

def scrape_all_majors():
    """Scrape all undergraduate majors from the GMU catalog"""
    # Ensure output directory exists
    ensure_output_dir()
    
    # Get college URLs
    colleges = get_college_urls()
    
    # Store all majors
    all_majors = []
    
    # Get majors from each college
    for college in colleges:
        college_majors = get_majors_from_college(college['url'], college['name'])
        all_majors.extend(college_majors)
        # Be nice to the server
        time.sleep(1)
    
    # Remove duplicates (based on URL)
    unique_majors = []
    unique_urls = set()
    for major in all_majors:
        if major['url'] not in unique_urls:
            unique_urls.add(major['url'])
            unique_majors.append(major)
    
    # Save to JSON
    output_file = os.path.join(OUTPUT_DIR, "all_majors.json")
    with open(output_file, 'w') as f:
        json.dump({
            'count': len(unique_majors),
            'majors': unique_majors
        }, f, indent=2)
    
    print(f"\nScraped {len(unique_majors)} unique undergraduate majors")
    print(f"Results saved to {output_file}")
    
    return unique_majors

def scrape_computing_majors():
    """Scrape only computing-related majors"""
    all_majors = scrape_all_majors()
    
    # Filter for computing-related majors
    computing_keywords = [
        'computer', 'computing', 'information', 'informatics', 'data', 
        'cybersecurity', 'cyber', 'software', 'systems'
    ]
    
    computing_majors = []
    for major in all_majors:
        if any(keyword in major['name'].lower() for keyword in computing_keywords):
            computing_majors.append(major)
    
    # Save to JSON
    output_file = os.path.join(OUTPUT_DIR, "computing_majors.json")
    with open(output_file, 'w') as f:
        json.dump({
            'count': len(computing_majors),
            'majors': computing_majors
        }, f, indent=2)
    
    print(f"\nFound {len(computing_majors)} computing-related majors")
    print(f"Results saved to {output_file}")
    
    return computing_majors

if __name__ == "__main__":
    print("GMU Major Catalog Scraper")
    print("-------------------------")
    
    # Create output directory if it doesn't exist
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'majorRequirements')
    os.makedirs(output_dir, exist_ok=True)
    
    # Get list of colleges/schools
    colleges = get_college_urls()
    
    if not colleges:
        print("Error: Unable to find any colleges or schools.")
        # Fallback to hardcoded main URL
        print("Using fallback method...")
        colleges = [{
            "name": "Engineering and Computing",
            "url": "https://catalog.gmu.edu/colleges-schools/engineering-computing/"
        }]
    
    # Extract all majors from each college
    all_majors = []
    for college in colleges:
        college_majors = get_majors_from_college(college["url"], college["name"])
        all_majors.extend(college_majors)
    
    # Remove duplicates based on URL
    unique_majors = []
    seen_urls = set()
    for major in all_majors:
        if major["url"] not in seen_urls:
            unique_majors.append(major)
            seen_urls.add(major["url"])
    
    print(f"\nFound {len(unique_majors)} unique undergraduate majors across {len(colleges)} colleges/schools.")
    
    # Save results to JSON file
    output_file = os.path.join(output_dir, 'all_majors.json')
    with open(output_file, 'w') as f:
        json.dump(unique_majors, f, indent=4)
    
    print(f"Results saved to {output_file}")
    print("Scraping completed.") 