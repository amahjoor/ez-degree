import os
import json
import time
import sys
from main import scrape_major_requirements

def load_bachelor_programs():
    """Load bachelor's degree programs from the json file"""
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "majorRequirements")
    programs_file = os.path.join(output_dir, "bachelor_programs.json")
    
    if not os.path.exists(programs_file):
        print(f"Error: Bachelor programs file not found at {programs_file}")
        print("Please run programs_scraper.py first to generate this file.")
        return []
    
    with open(programs_file, 'r', encoding='utf-8') as f:
        programs = json.load(f)
    
    print(f"Loaded {len(programs)} bachelor's programs")
    return programs

def scrape_requirements_for_all_majors():
    """Scrape requirements for all undergraduate majors"""
    print("Step 1: Loading all bachelor's programs...")
    programs = load_bachelor_programs()
    
    if not programs:
        print("No programs found to scrape. Exiting.")
        return None
    
    print("\nStep 2: Scraping requirements for each major...")
    successful = []
    failed = []
    
    # Create output directory if it doesn't exist
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "majorRequirements")
    os.makedirs(output_dir, exist_ok=True)
    
    # Let user choose how many programs to scrape
    max_programs = len(programs)
    limit = max_programs
    
    try:
        limit_input = input(f"How many programs to scrape? (1-{max_programs}, default: all): ")
        if limit_input.strip():
            limit = min(int(limit_input), max_programs)
    except ValueError:
        print(f"Invalid input. Using default: all {max_programs} programs.")
    
    # Let user choose starting index
    start_idx = 0
    try:
        start_idx_input = input(f"Start from which program? (0-{max_programs-1}, default: 0): ")
        if start_idx_input.strip():
            start_idx = min(max(0, int(start_idx_input)), max_programs-1)
    except ValueError:
        print("Invalid input. Starting from index 0.")
    
    programs_to_scrape = programs[start_idx:start_idx+limit]
    
    print(f"\nScraping {len(programs_to_scrape)} programs starting from index {start_idx}...")
    
    for i, program in enumerate(programs_to_scrape):
        # Extract program info - use name and URL
        program_name = program.get('name', '')
        program_url = program.get('url', '')
        
        if not program_name or not program_url:
            print(f"Skipping program {i+1}/{len(programs_to_scrape)}: Missing name or URL")
            failed.append({
                "program": program,
                "error": "Missing name or URL"
            })
            continue
        
        print(f"\nProcessing program {i+1}/{len(programs_to_scrape)}: {program_name}")
        print(f"URL: {program_url}")
        
        try:
            result = scrape_major_requirements(program_name, program_url)
            if result:
                successful.append(program)
                print(f"✓ Successfully scraped requirements for {program_name}")
            else:
                failed.append({
                    "program": program,
                    "error": "Scraping returned no data"
                })
                print(f"✗ Failed to scrape requirements for {program_name}: No data")
        except Exception as e:
            failed.append({
                "program": program,
                "error": str(e)
            })
            print(f"✗ Error scraping requirements for {program_name}: {str(e)}")
        
        # Be respectful to the server
        time.sleep(2)
    
    # Save results summary
    results = {
        "total": len(programs_to_scrape),
        "successful": len(successful),
        "failed": len(failed),
        "successful_programs": successful,
        "failed_programs": failed
    }
    
    results_file = os.path.join(output_dir, "scraping_results.json")
    
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    print("\n--- Scraping Summary ---")
    print(f"Total programs: {len(programs_to_scrape)}")
    print(f"Successfully scraped: {len(successful)}")
    print(f"Failed to scrape: {len(failed)}")
    print(f"Results saved to {results_file}")
    
    return results

def scrape_computing_majors_requirements():
    """Scrape requirements only for computing-related majors"""
    # Load all bachelor's programs
    programs = load_bachelor_programs()
    
    if not programs:
        print("No programs found to scrape. Exiting.")
        return None
    
    # Filter for computing-related majors
    computing_keywords = [
        'computer', 'computing', 'information', 'informatics', 'data', 
        'cybersecurity', 'cyber', 'software', 'systems', 'engineering'
    ]
    
    computing_programs = []
    for program in programs:
        program_name = program.get('name', '').lower()
        if any(keyword in program_name for keyword in computing_keywords):
            computing_programs.append(program)
    
    print(f"\nFound {len(computing_programs)} computing-related programs out of {len(programs)} total programs")
    
    # Create output directory if it doesn't exist
    output_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "majorRequirements")
    os.makedirs(output_dir, exist_ok=True)
    
    # Save computing programs list
    computing_file = os.path.join(output_dir, "computing_programs.json")
    with open(computing_file, 'w', encoding='utf-8') as f:
        json.dump(computing_programs, f, indent=2)
    
    print(f"Computing programs list saved to {computing_file}")
    
    # Let user choose how many programs to scrape
    max_programs = len(computing_programs)
    limit = max_programs
    
    try:
        limit_input = input(f"How many computing programs to scrape? (1-{max_programs}, default: all): ")
        if limit_input.strip():
            limit = min(int(limit_input), max_programs)
    except ValueError:
        print(f"Invalid input. Using default: all {max_programs} programs.")
    
    programs_to_scrape = computing_programs[:limit]
    
    print(f"\nScraping {len(programs_to_scrape)} computing programs...")
    
    successful = []
    failed = []
    
    for i, program in enumerate(programs_to_scrape):
        # Extract program info - use name and URL
        program_name = program.get('name', '')
        program_url = program.get('url', '')
        
        if not program_name or not program_url:
            print(f"Skipping program {i+1}/{len(programs_to_scrape)}: Missing name or URL")
            failed.append({
                "program": program,
                "error": "Missing name or URL"
            })
            continue
        
        print(f"\nProcessing program {i+1}/{len(programs_to_scrape)}: {program_name}")
        print(f"URL: {program_url}")
        
        try:
            result = scrape_major_requirements(program_name, program_url)
            if result:
                successful.append(program)
                print(f"✓ Successfully scraped requirements for {program_name}")
            else:
                failed.append({
                    "program": program,
                    "error": "Scraping returned no data"
                })
                print(f"✗ Failed to scrape requirements for {program_name}: No data")
        except Exception as e:
            failed.append({
                "program": program,
                "error": str(e)
            })
            print(f"✗ Error scraping requirements for {program_name}: {str(e)}")
        
        # Be respectful to the server
        time.sleep(2)
    
    # Save results summary
    results = {
        "total": len(programs_to_scrape),
        "successful": len(successful),
        "failed": len(failed),
        "successful_programs": successful,
        "failed_programs": failed
    }
    
    results_file = os.path.join(output_dir, "computing_scraping_results.json")
    
    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2)
    
    print("\n--- Scraping Summary ---")
    print(f"Total computing programs: {len(programs_to_scrape)}")
    print(f"Successfully scraped: {len(successful)}")
    print(f"Failed to scrape: {len(failed)}")
    print(f"Results saved to {results_file}")
    
    return results

if __name__ == "__main__":
    print("GMU Major Requirements Scraper")
    print("-----------------------------")
    
    choice = input("Choose an option:\n1. Scrape ALL majors (may take a long time)\n2. Scrape only computing-related majors\nEnter choice (1/2): ")
    
    if choice == "1":
        scrape_requirements_for_all_majors()
    elif choice == "2":
        scrape_computing_majors_requirements()
    else:
        print("Invalid choice. Please run the script again and select 1 or 2.")
    
    print("\nDone!") 