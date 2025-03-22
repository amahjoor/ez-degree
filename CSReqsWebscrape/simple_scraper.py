import json
import re
import requests
from bs4 import BeautifulSoup
import sys
import os

class CourseRequirement:
    def __init__(self, code="", title="", credits=0):
        self.code = code
        self.title = title
        self.credits = credits
        self.alternatives = []
        self.notes = ""
    
    def to_dict(self):
        return {
            "code": self.code,
            "title": self.title,
            "credits": self.credits,
            "alternatives": self.alternatives,
            "notes": self.notes
        }

class Category:
    def __init__(self, name):
        self.name = name
        self.courses = []
        self.total_credits = 0
    
    def to_dict(self):
        return {
            "name": self.name,
            "total_credits": self.total_credits,
            "courses": [course.to_dict() for course in self.courses]
        }

def extract_credits(text):
    if not text:
        return 0
    
    # Try to match numeric values
    match = re.search(r'(\d+(?:\.\d+)?)', text)
    if match:
        return float(match.group(1))
    return 0

def parse_cs_requirements():
    # This is the HTML content you provided in your message
    html_content = """
<div id="requirementstext">
<p class="bannercode"><strong>Banner Code: EC-BS-CS</strong></p><h2>Degree Requirements</h2>
<p>Total credits: 120</p>
<h3 class="toggle">Computer Science Core</h3> 
<table class="sc_courselist"> 
<tbody> 
<tr><td class="codecol"><a href="/search/?P=CS%20110" title="CS&nbsp;110" class="bubblelink code">CS&nbsp;110</a></td><td>Essentials of Computer Science <sup>1</sup></td><td class="hourscol">3</td></tr> 
<tr><td class="codecol"><a href="/search/?P=CS%20112" title="CS&nbsp;112" class="bubblelink code">CS&nbsp;112</a></td><td>Introduction to Computer Programming</td><td class="hourscol">4</td></tr> 
<tr class="orclass"><td class="codecol orclass">or&nbsp;<a href="/search/?P=CS%20108" title="CS&nbsp;108" class="bubblelink code">CS&nbsp;108</a><br><span style="margin-left:20px;" class="blockindent">&amp;&nbsp;<a href="/search/?P=CS%20109" title="CS&nbsp;109" class="bubblelink code">CS&nbsp;109</a></span></td><td colspan="2"> Intro to Computer Programming, Part A<br><span style="margin-left:20px;" class="blockindent">and Intro to Computer Programming, Part B</span></td></tr> 
<tr><td class="codecol"><a href="/search/?P=CS%20211" title="CS&nbsp;211" class="bubblelink code">CS&nbsp;211</a></td><td>Object-Oriented Programming</td><td class="hourscol">3</td></tr> 
<tr><td class="codecol"><a href="/search/?P=CS%20262" title="CS&nbsp;262" class="bubblelink code">CS&nbsp;262</a></td><td>Introduction to Low-Level Programming</td><td class="hourscol">3</td></tr> 
<tr><td class="codecol"><a href="/search/?P=CS%20306" title="CS&nbsp;306" class="bubblelink code">CS&nbsp;306</a></td><td>Synthesis of Ethics and Law for the Computing Professional</td><td class="hourscol">3</td></tr> 
<tr><td class="codecol"><a href="/search/?P=CS%20310" title="CS&nbsp;310" class="bubblelink code">CS&nbsp;310</a></td><td>Data Structures</td><td class="hourscol">3</td></tr> 
<tr><td class="codecol"><a href="/search/?P=CS%20321" title="CS&nbsp;321" class="bubblelink code">CS&nbsp;321</a></td><td>Software Engineering</td><td class="hourscol">3</td></tr> 
<tr><td class="codecol"><a href="/search/?P=CS%20330" title="CS&nbsp;330" class="bubblelink code">CS&nbsp;330</a></td><td>Formal Methods and Models</td><td class="hourscol">3</td></tr> 
<tr><td class="codecol"><a href="/search/?P=CS%20367" title="CS&nbsp;367" class="bubblelink code">CS&nbsp;367</a></td><td>Computer Systems and Programming</td><td class="hourscol">4</td></tr> 
<tr><td class="codecol"><a href="/search/?P=CS%20471" title="CS&nbsp;471" class="bubblelink code">CS&nbsp;471</a></td><td>Operating Systems</td><td class="hourscol">3</td></tr> 
<tr><td class="codecol"><a href="/search/?P=CS%20483" title="CS&nbsp;483" class="bubblelink code">CS&nbsp;483</a></td><td>Analysis of Algorithms</td><td class="hourscol">3</td></tr> 
<tr class="listsum"><td colspan="2">Total Credits</td><td class="hourscol">35</td></tr></tbody> 
</table>

<h3 class="toggle">Senior Computer Science</h3> 
<table class="sc_courselist"> 
<tbody> 
<tr><td colspan="2"><span class="courselistcomment">Select one from the following:</span></td><td class="hourscol">3</td></tr> 
<tr><td class="codecol"><div style="margin-left:20px;" class="blockindent"><a href="/search/?P=CS%20455" title="CS&nbsp;455" class="bubblelink code">CS&nbsp;455</a></div></td><td>Computer Communications and Networking</td><td class="hourscol"></td></tr> 
<tr><td class="codecol"><div style="margin-left:20px;" class="blockindent"><a href="/search/?P=CS%20468" title="CS&nbsp;468" class="bubblelink code">CS&nbsp;468</a></div></td><td>Secure Programming and Systems</td><td class="hourscol"></td></tr> 
<tr><td class="codecol"><div style="margin-left:20px;" class="blockindent"><a href="/search/?P=CS%20475" title="CS&nbsp;475" class="bubblelink code">CS&nbsp;475</a></div></td><td>Concurrent and Distributed Systems</td><td class="hourscol"></td></tr> 
<tr><td class="codecol"><div style="margin-left:20px;" class="blockindent"><a href="/search/?P=CS%20487" title="CS&nbsp;487" class="bubblelink code">CS&nbsp;487</a></div></td><td>Introduction to Cryptography</td><td class="hourscol"></td></tr> 
<tr><td colspan="2"><span class="courselistcomment">Select four additional courses from the following:</span></td><td class="hourscol">12</td></tr> 
<tr><td class="codecol"><div style="margin-left:20px;" class="blockindent"><a href="/search/?P=CS%20425" title="CS&nbsp;425" class="bubblelink code">CS&nbsp;425</a></div></td><td>Game Programming I</td><td class="hourscol"></td></tr> 
<tr><td class="codecol"><div style="margin-left:20px;" class="blockindent"><a href="/search/?P=CS%20440" title="CS&nbsp;440" class="bubblelink code">CS&nbsp;440</a></div></td><td>Compilers</td><td class="hourscol"></td></tr> 
</tbody> 
</table>

<h3 class="toggle">Mathematics</h3> 
<table class="sc_courselist"> 
<tbody> 
<tr><td class="codecol"><a href="/search/?P=MATH%20113" title="MATH&nbsp;113" class="bubblelink code">MATH&nbsp;113</a></td><td>Analytic Geometry and Calculus I</td><td class="hourscol">4</td></tr> 
<tr class="orclass"><td class="codecol orclass">or&nbsp;<a href="/search/?P=MATH%20123" title="MATH&nbsp;123" class="bubblelink code">MATH&nbsp;123</a><br><span style="margin-left:20px;" class="blockindent">&amp;&nbsp;<a href="/search/?P=MATH%20124" title="MATH&nbsp;124" class="bubblelink code">MATH&nbsp;124</a></span></td><td colspan="2"> Calculus with Algebra/Trigonometry, Part A<br><span style="margin-left:20px;" class="blockindent">and Calculus with Algebra/Trigonometry, Part B</span></td></tr> 
<tr><td class="codecol"><a href="/search/?P=MATH%20114" title="MATH&nbsp;114" class="bubblelink code">MATH&nbsp;114</a></td><td>Analytic Geometry and Calculus II</td><td class="hourscol">4</td></tr> 
<tr><td class="codecol"><a href="/search/?P=MATH%20125" title="MATH&nbsp;125" class="bubblelink code">MATH&nbsp;125</a></td><td>Discrete Mathematics I</td><td class="hourscol">3</td></tr> 
<tr><td class="codecol"><a href="/search/?P=MATH%20203" title="MATH&nbsp;203" class="bubblelink code">MATH&nbsp;203</a></td><td>Linear Algebra</td><td class="hourscol">3</td></tr> 
<tr><td class="codecol"><a href="/search/?P=MATH%20213" title="MATH&nbsp;213" class="bubblelink code">MATH&nbsp;213</a></td><td>Analytic Geometry and Calculus III</td><td class="hourscol">3</td></tr> 
<tr class="listsum"><td colspan="2">Total Credits</td><td class="hourscol">17</td></tr></tbody> 
</table>

<h3 class="toggle">Statistics</h3> 
<table class="sc_courselist"> 
<tbody> 
<tr><td class="codecol"><a href="/search/?P=STAT%20344" title="STAT&nbsp;344" class="bubblelink code">STAT&nbsp;344</a></td><td>Probability and Statistics for Engineers and Scientists I</td><td class="hourscol">3</td></tr> 
</tbody> 
</table>
</div>
    """
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    requirements = {
        "degree_name": "Computer Science BS",
        "total_credits": 120,
        "categories": []
    }
    
    # Find all category headers (h3 tags)
    categories = soup.find_all('h3', class_='toggle')
    
    for category_element in categories:
        category_name = category_element.text.strip()
        category = Category(category_name)
        
        # Get the table following this header
        table = category_element.find_next('table', class_='sc_courselist')
        if not table:
            continue
        
        # Extract total credits if available
        total_credit_row = table.find('tr', class_='listsum')
        if total_credit_row:
            credit_cell = total_credit_row.find('td', class_='hourscol')
            if credit_cell:
                category.total_credits = extract_credits(credit_cell.text)
        
        # Process all rows in the table
        for row in table.find_all('tr'):
            # Skip header and summary rows
            if 'listsum' in row.get('class', []) or row.find('th'):
                continue
            
            # Skip comment rows
            if row.find('span', class_='courselistcomment'):
                continue
                
            # Handle alternative courses
            if 'orclass' in row.get('class', []):
                # This is an alternative course
                alt_code_cell = row.find('td', class_='codecol')
                if alt_code_cell:
                    alt_text = alt_code_cell.text.strip()
                    
                    # Extract the course code after 'or'
                    or_match = re.search(r'or\s+([A-Z]+\s+\d+[A-Z]*)', alt_text)
                    if or_match and category.courses:
                        # Add as alternative to the previous course
                        prev_course = category.courses[-1]
                        prev_course.alternatives.append(or_match.group(1).strip())
                        
                        # Check for additional courses (with &)
                        amp_matches = re.findall(r'&\s+([A-Z]+\s+\d+[A-Z]*)', alt_text)
                        for amp_match in amp_matches:
                            prev_course.alternatives.append(amp_match.strip())
            else:
                # Regular course row
                code_cell = row.find('td', class_='codecol')
                title_cell = row.find('td', {'class': None})
                credit_cell = row.find('td', class_='hourscol')
                
                if code_cell and title_cell:
                    # Extract course code
                    code_link = code_cell.find('a')
                    code = code_link.text.strip() if code_link else code_cell.text.strip()
                    
                    # Extract title (remove footnotes)
                    title = title_cell.text.strip()
                    title = re.sub(r'\s*\(\d+\)\s*$|\s*<sup>\d+</sup>\s*$', '', title)
                    
                    # Extract credits
                    credits = 0
                    if credit_cell and credit_cell.text.strip():
                        credits = extract_credits(credit_cell.text)
                    
                    # Create course object and add to category
                    if code and title:
                        course = CourseRequirement(code, title, credits)
                        category.courses.append(course)
        
        # Add category to requirements if it has courses
        if category.courses:
            requirements["categories"].append(category)
    
    return requirements

def save_to_json(requirements, filename="cs_requirements_simple.json"):
    if requirements:
        # Create majorRequirements directory if it doesn't exist
        output_dir = "majorRequirements"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            print(f"Created directory: {output_dir}")
        
        # Set file path within the majorRequirements directory
        file_path = os.path.join(output_dir, filename)
        
        # Convert to a serializable format
        requirements_dict = {
            "degree_name": requirements["degree_name"],
            "total_credits": requirements["total_credits"],
            "categories": [category.to_dict() for category in requirements["categories"]]
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(requirements_dict, f, indent=2)
        
        print(f"Requirements saved to {file_path}")
        
        return file_path

def fetch_gmu_cs_requirements():
    url = "https://catalog.gmu.edu/colleges-schools/engineering-computing/school-computing/computer-science/computer-science-bs/#requirementstext"
    print(f"Fetching requirements from {url}...")
    
    try:
        response = requests.get(url)
        if response.status_code == 200:
            html_content = response.text
            
            # Extract the requirements section
            soup = BeautifulSoup(html_content, 'html.parser')
            requirements_div = soup.find('div', id='requirementstext')
            
            if requirements_div:
                return requirements_div.decode_contents()
            else:
                print("Could not find requirements section in the HTML.")
                return None
        else:
            print(f"Failed to fetch the page. Status code: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error fetching the page: {e}")
        return None

def main():
    print("Simple GMU CS Requirements Scraper")
    print("----------------------------------")
    
    # Check if command line arguments specify fetch mode
    use_live = False
    if len(sys.argv) > 1 and sys.argv[1].lower() in ['live', '--live', '-l']:
        use_live = True
    else:
        # Default to using embedded HTML
        print("Using embedded HTML data (use 'live' argument to fetch from website)")
    
    requirements = None
    if use_live:
        # Fetch from live website
        html_content = fetch_gmu_cs_requirements()
        if html_content:
            # Create a BeautifulSoup object with the fetched HTML
            soup = BeautifulSoup(f'<div id="requirementstext">{html_content}</div>', 'html.parser')
            
            # Use the requirements parsing logic
            requirements = {
                "degree_name": "Computer Science BS",
                "total_credits": 120,
                "categories": []
            }
            
            # Find all category headers (h3 tags)
            categories = soup.find_all('h3', class_='toggle')
            
            # Process each category
            for category_element in categories:
                # Same processing logic as in parse_cs_requirements
                category_name = category_element.text.strip()
                category = Category(category_name)
                
                # Get the table following this header
                table = category_element.find_next('table', class_='sc_courselist')
                if not table:
                    continue
                
                # Extract total credits if available
                total_credit_row = table.find('tr', class_='listsum')
                if total_credit_row:
                    credit_cell = total_credit_row.find('td', class_='hourscol')
                    if credit_cell:
                        category.total_credits = extract_credits(credit_cell.text)
                
                # Process all rows in the table
                for row in table.find_all('tr'):
                    # Skip header and summary rows
                    if 'listsum' in row.get('class', []) or row.find('th'):
                        continue
                    
                    # Skip comment rows
                    if row.find('span', class_='courselistcomment'):
                        continue
                        
                    # Handle alternative courses
                    if 'orclass' in row.get('class', []):
                        # This is an alternative course
                        alt_code_cell = row.find('td', class_='codecol')
                        if alt_code_cell:
                            alt_text = alt_code_cell.text.strip()
                            
                            # Extract the course code after 'or'
                            or_match = re.search(r'or\s+([A-Z]+\s+\d+[A-Z]*)', alt_text)
                            if or_match and category.courses:
                                # Add as alternative to the previous course
                                prev_course = category.courses[-1]
                                prev_course.alternatives.append(or_match.group(1).strip())
                                
                                # Check for additional courses (with &)
                                amp_matches = re.findall(r'&\s+([A-Z]+\s+\d+[A-Z]*)', alt_text)
                                for amp_match in amp_matches:
                                    prev_course.alternatives.append(amp_match.strip())
                    else:
                        # Regular course row
                        code_cell = row.find('td', class_='codecol')
                        title_cell = row.find('td', {'class': None})
                        credit_cell = row.find('td', class_='hourscol')
                        
                        if code_cell and title_cell:
                            # Extract course code
                            code_link = code_cell.find('a')
                            code = code_link.text.strip() if code_link else code_cell.text.strip()
                            
                            # Extract title (remove footnotes)
                            title = title_cell.text.strip()
                            title = re.sub(r'\s*\(\d+\)\s*$|\s*<sup>\d+</sup>\s*$', '', title)
                            
                            # Extract credits
                            credits = 0
                            if credit_cell and credit_cell.text.strip():
                                credits = extract_credits(credit_cell.text)
                            
                            # Create course object and add to category
                            if code and title:
                                course = CourseRequirement(code, title, credits)
                                category.courses.append(course)
                
                # Add category to requirements if it has courses
                if category.courses:
                    requirements["categories"].append(category)
    else:
        # Use the embedded HTML
        requirements = parse_cs_requirements()
    
    if requirements:
        print(f"\nRequirements for: {requirements['degree_name']}")
        print(f"Total Credits Required: {requirements['total_credits']}")
        
        # Print category information
        for category in requirements["categories"]:
            print(f"\n{category.name.upper()}:")
            print(f"Total Credits: {category.total_credits}")
            
            # Print courses in this category
            if category.courses:
                print(f"Courses ({len(category.courses)}):")
                for course in category.courses:
                    print(f"  {course.code}: {course.title} ({course.credits} credits)")
                    if course.alternatives:
                        print(f"    Alternatives: {', '.join(course.alternatives)}")
        
        # Save to JSON file
        save_to_json(requirements)
    else:
        print("Failed to extract requirements.")

if __name__ == "__main__":
    main() 