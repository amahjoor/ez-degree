#!/usr/bin/env python3
"""
Degree Visualization Data Scraper

This script pre-scrapes all the data needed for the degree visualization page,
eliminating the need for multiple API calls during runtime.

It fetches:
1. All majors and their course requirements
2. All unique courses and their prerequisites/corequisites
3. Creates optimized data structures for fast frontend loading
"""

import json
import os
import sys
import requests
import time
import asyncio
import aiohttp
from typing import Dict, List, Set, Any
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import threading

# Add the project root directory to Python path
script_dir = Path(__file__).parent
project_root = script_dir.parent
sys.path.append(str(project_root))

# API configuration
API_BASE_URL = "http://localhost:8000"  # Adjust based on your API server

class DegreeVisualizationScraper:
    def __init__(self, api_base_url: str = API_BASE_URL):
        self.api_base_url = api_base_url
        self.scraped_data = {
            "majors": [],
            "course_dependencies": {},
            "degree_requirements": {},
            "metadata": {
                "scraped_at": None,
                "total_majors": 0,
                "total_courses": 0,
                "api_version": "1.0"
            }
        }
        
        # Ensure output directory exists
        self.output_dir = project_root / "data" / "degree_visualization"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def test_api_connection(self) -> bool:
        """Test if the API server is running and accessible"""
        try:
            response = requests.get(f"{self.api_base_url}/", timeout=5)
            return response.status_code == 200
        except requests.exceptions.RequestException:
            return False
    
    def fetch_majors(self) -> List[Dict[str, str]]:
        """Fetch all available majors"""
        print("📚 Fetching all majors...")
        try:
            response = requests.get(f"{self.api_base_url}/requirements/majors")
            response.raise_for_status()
            data = response.json()
            majors = data.get("majors", [])
            print(f"✅ Found {len(majors)} majors")
            return majors
        except requests.exceptions.RequestException as e:
            print(f"❌ Error fetching majors: {e}")
            return []
    
    def fetch_major_requirements(self, major_id: str) -> Dict[str, Any]:
        """Fetch requirements for a specific major"""
        try:
            response = requests.get(f"{self.api_base_url}/requirements/majors/{major_id}")
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"❌ Error fetching requirements for {major_id}: {e}")
            return {}
    
    def fetch_major_concentrations(self, major_id: str) -> List[Dict[str, str]]:
        """Fetch concentrations for a specific major"""
        try:
            response = requests.get(f"{self.api_base_url}/requirements/majors/{major_id}/concentrations")
            response.raise_for_status()
            data = response.json()
            return data.get("concentrations", [])
        except requests.exceptions.RequestException as e:
            print(f"❌ Error fetching concentrations for {major_id}: {e}")
            return []
    
    def fetch_course_details(self, course_code: str) -> Dict[str, Any]:
        """Fetch detailed information for a specific course"""
        try:
            # Additional validation before making the request
            if not self.is_valid_course_code(course_code):
                return {}
            
            encoded_course = requests.utils.quote(course_code, safe='')
            response = requests.get(f"{self.api_base_url}/courses/{encoded_course}/basic", timeout=10)
            
            if response.status_code == 404:
                # Course not found - this is expected for some courses
                return {}
            elif response.status_code == 500:
                # Server error - likely due to invalid course code format
                return {}
            
            response.raise_for_status()
            return response.json()
        except requests.exceptions.Timeout:
            print(f"   ⏰ Timeout fetching details for {course_code}")
            return {}
        except requests.exceptions.RequestException as e:
            # Don't print error here as it will be handled by the caller
            return {}
    
    def extract_courses_from_requirements(self, requirements: Dict[str, Any]) -> Set[str]:
        """Extract all course codes from degree requirements"""
        courses = set()
        
        # Extract from main categories
        for category in requirements.get("categories", []):
            for course in category.get("courses", []):
                course_code = course.get("code")
                if course_code and self.is_valid_course_code(course_code):
                    courses.add(course_code)
        
        # Extract from concentrations
        for concentration in requirements.get("concentrations", []):
            for category in concentration.get("categories", []):
                for course in category.get("courses", []):
                    course_code = course.get("code")
                    if course_code and self.is_valid_course_code(course_code):
                        courses.add(course_code)
        
        return courses
    
    def is_valid_course_code(self, course_code: str) -> bool:
        """Check if a course code looks valid"""
        if not course_code or not isinstance(course_code, str):
            return False
        
        course_code = course_code.strip()
        
        # Skip obvious non-course codes
        invalid_patterns = [
            "select", "choose", "from:", "electives", "complete", "total",
            "hours", "credits", "minimum", "maximum", "additional", "other",
            "any", "all", "must", "should", "required", "optional"
        ]
        
        for pattern in invalid_patterns:
            if pattern.lower() in course_code.lower():
                return False
        
        # Valid course codes typically have format like "CS 110", "MATH 125", etc.
        # Should have letters followed by numbers
        import re
        if not re.match(r'^[A-Z]{2,5}\s+\d{3,4}[A-Z]*$', course_code.upper().strip()):
            # Also allow some variations like "CS110" or "MATH-125"
            if not re.match(r'^[A-Z]{2,5}[-\s]*\d{3,4}[A-Z]*$', course_code.upper().strip()):
                return False
        
        return True
    
    def scrape_all_degree_data(self):
        """Main scraping function that collects all degree visualization data"""
        print("🚀 Starting comprehensive degree visualization data scraping...")
        
        # Test API connection
        if not self.test_api_connection():
            print(f"❌ Cannot connect to API at {self.api_base_url}")
            print("Please ensure the API server is running with: python -m api.main")
            return False
        
        print("✅ API connection successful")
        
        # Fetch all majors
        majors = self.fetch_majors()
        if not majors:
            print("❌ No majors found, stopping scraping")
            return False
        
        self.scraped_data["majors"] = majors
        self.scraped_data["metadata"]["total_majors"] = len(majors)
        
        all_courses = set()
        
        # Fetch requirements for each major
        print("\n📊 Fetching degree requirements...")
        for i, major in enumerate(majors, 1):
            major_id = major["id"]
            major_name = major["name"]
            
            print(f"[{i}/{len(majors)}] Processing {major_name}...")
            
            # Fetch base requirements
            requirements = self.fetch_major_requirements(major_id)
            if requirements:
                self.scraped_data["degree_requirements"][major_id] = requirements
                
                # Extract courses from this major
                major_courses = self.extract_courses_from_requirements(requirements)
                all_courses.update(major_courses)
                print(f"   📋 Found {len(major_courses)} courses in {major_name}")
                
                # Fetch concentrations
                concentrations = self.fetch_major_concentrations(major_id)
                if concentrations:
                    print(f"   🎯 Found {len(concentrations)} concentrations")
                    
                    # Fetch requirements for each concentration
                    for concentration in concentrations:
                        conc_id = concentration["id"]
                        conc_requirements = self.fetch_major_requirements(f"{major_id}?concentration_id={conc_id}")
                        if conc_requirements:
                            conc_courses = self.extract_courses_from_requirements(conc_requirements)
                            all_courses.update(conc_courses)
                            print(f"     📋 Added {len(conc_courses)} courses from {concentration['name']}")
            
            # Small delay to be respectful to the API
            time.sleep(0.1)
        
        print(f"\n🔍 Found {len(all_courses)} unique courses across all majors")
        self.scraped_data["metadata"]["total_courses"] = len(all_courses)
        
        # Fetch detailed information for all courses (OPTIMIZED)
        print("\n📖 Fetching course details and dependencies...")
        print("🚀 Using high-speed concurrent processing...")
        
        all_courses_list = list(all_courses)
        start_time = time.time()
        
        # Use async processing for maximum speed
        successful_fetches, failed_fetches = asyncio.run(
            self.fetch_all_courses_async(all_courses_list)
        )
        
        elapsed_time = time.time() - start_time
        print(f"\n📈 Course fetching complete in {elapsed_time:.1f} seconds:")
        print(f"   ✅ Successfully fetched: {successful_fetches}")
        print(f"   ❌ Failed to fetch: {failed_fetches}")
        if successful_fetches + failed_fetches > 0:
            print(f"   📊 Success rate: {(successful_fetches/(successful_fetches+failed_fetches)*100):.1f}%")
            print(f"   ⚡ Speed: {(successful_fetches+failed_fetches)/elapsed_time:.1f} courses/second")
        
        # Add metadata
        from datetime import datetime
        self.scraped_data["metadata"]["scraped_at"] = datetime.now().isoformat()
        
        print(f"\n✅ Scraping complete!")
        print(f"   📚 Majors: {self.scraped_data['metadata']['total_majors']}")
        print(f"   📖 Courses: {len(self.scraped_data['course_dependencies'])}")
        
        return True
    
    async def fetch_all_courses_async(self, all_courses_list: List[str]) -> tuple[int, int]:
        """Fetch all course details using high-speed async processing"""
        batch_size = 100  # Larger batches since we're using lightweight endpoint
        max_concurrent = 30  # More concurrent requests since no professor data loading
        successful_fetches = 0
        failed_fetches = 0
        
        # Create semaphore to limit concurrent requests
        semaphore = asyncio.Semaphore(max_concurrent)
        
        # Process courses in batches
        total_batches = (len(all_courses_list) + batch_size - 1) // batch_size
        
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=5),  # Reduced timeout for lightweight endpoint
            connector=aiohttp.TCPConnector(limit=max_concurrent)
        ) as session:
            
            for i in range(0, len(all_courses_list), batch_size):
                batch = all_courses_list[i:i + batch_size]
                batch_num = i // batch_size + 1
                
                print(f"[{batch_num}/{total_batches}] Processing {len(batch)} courses concurrently...")
                
                # Process entire batch concurrently
                tasks = [
                    self.fetch_course_details_async(session, semaphore, course_code)
                    for course_code in batch
                ]
                
                # Wait for all tasks in batch to complete
                results = await asyncio.gather(*tasks, return_exceptions=True)
                
                # Process results
                for course_code, result in zip(batch, results):
                    if isinstance(result, Exception):
                        failed_fetches += 1
                        continue
                        
                    if result:
                        # Store course dependency information
                        self.scraped_data["course_dependencies"][course_code] = {
                            "code": course_code,
                            "title": result.get("title", ""),
                            "credits": result.get("credits", ""),
                            "description": result.get("description", ""),
                            "prerequisites": result.get("prerequisites", ""),
                            "corequisites": result.get("corequisites", ""),
                            "restrictions": result.get("restrictions", ""),
                            "notes": result.get("notes", "")
                        }
                        successful_fetches += 1
                    else:
                        failed_fetches += 1
                
                # Progress update for large batches
                if batch_num % 5 == 0 or batch_num == total_batches:
                    print(f"   📊 Progress: {successful_fetches} successful, {failed_fetches} failed")
        
        return successful_fetches, failed_fetches
    
    async def fetch_course_details_async(self, session: aiohttp.ClientSession, semaphore: asyncio.Semaphore, course_code: str) -> Dict[str, Any]:
        """Async version of fetch_course_details for high-speed processing"""
        async with semaphore:  # Limit concurrent requests
            try:
                # Additional validation before making the request
                if not self.is_valid_course_code(course_code):
                    return {}
                
                encoded_course = requests.utils.quote(course_code, safe='')
                url = f"{self.api_base_url}/courses/{encoded_course}/basic"
                
                async with session.get(url) as response:
                    if response.status == 404:
                        # Course not found - this is expected for some courses
                        return {}
                    elif response.status == 500:
                        # Server error - likely due to invalid course code format
                        return {}
                    elif response.status != 200:
                        return {}
                    
                    return await response.json()
                    
            except asyncio.TimeoutError:
                return {}
            except Exception:
                return {}
    
    def save_scraped_data(self):
        """Save the scraped data to JSON files"""
        print("\n💾 Saving scraped data...")
        
        # Save comprehensive data file
        comprehensive_file = self.output_dir / "comprehensive_degree_data.json"
        with open(comprehensive_file, 'w', encoding='utf-8') as f:
            json.dump(self.scraped_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Saved comprehensive data to: {comprehensive_file}")
        
        # Save individual components for easier access
        
        # Save course dependencies separately
        course_deps_file = self.output_dir / "course_dependencies.json"
        with open(course_deps_file, 'w', encoding='utf-8') as f:
            json.dump(self.scraped_data["course_dependencies"], f, indent=2, ensure_ascii=False)
        
        # Save degree requirements separately
        degree_reqs_file = self.output_dir / "degree_requirements.json"
        with open(degree_reqs_file, 'w', encoding='utf-8') as f:
            json.dump(self.scraped_data["degree_requirements"], f, indent=2, ensure_ascii=False)
        
        # Save majors list separately
        majors_file = self.output_dir / "majors_list.json"
        with open(majors_file, 'w', encoding='utf-8') as f:
            json.dump({
                "majors": self.scraped_data["majors"],
                "metadata": self.scraped_data["metadata"]
            }, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Saved component files:")
        print(f"   📖 Course dependencies: {course_deps_file}")
        print(f"   📊 Degree requirements: {degree_reqs_file}")
        print(f"   📚 Majors list: {majors_file}")
        
        return True
    
    def generate_summary_report(self):
        """Generate a summary report of the scraped data"""
        print("\n📈 Generating summary report...")
        
        # Calculate statistics
        total_majors = len(self.scraped_data["majors"])
        total_courses = len(self.scraped_data["course_dependencies"])
        
        # Count courses with prerequisites
        courses_with_prereqs = sum(1 for course in self.scraped_data["course_dependencies"].values() 
                                 if course.get("prerequisites"))
        
        # Count courses with corequisites
        courses_with_coreqs = sum(1 for course in self.scraped_data["course_dependencies"].values() 
                                if course.get("corequisites"))
        
        # Most common subjects
        subjects = {}
        for course_code in self.scraped_data["course_dependencies"].keys():
            if ' ' in course_code:
                subject = course_code.split(' ')[0]
                subjects[subject] = subjects.get(subject, 0) + 1
        
        top_subjects = sorted(subjects.items(), key=lambda x: x[1], reverse=True)[:10]
        
        report = {
            "summary": {
                "total_majors": total_majors,
                "total_courses": total_courses,
                "courses_with_prerequisites": courses_with_prereqs,
                "courses_with_corequisites": courses_with_coreqs,
                "prerequisite_coverage": f"{(courses_with_prereqs/total_courses)*100:.1f}%" if total_courses > 0 else "0%",
                "corequisite_coverage": f"{(courses_with_coreqs/total_courses)*100:.1f}%" if total_courses > 0 else "0%"
            },
            "top_subjects": dict(top_subjects),
            "scraped_at": self.scraped_data["metadata"]["scraped_at"]
        }
        
        # Save report
        report_file = self.output_dir / "scraping_report.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Summary report saved to: {report_file}")
        print(f"\n📊 Quick Stats:")
        print(f"   📚 Total majors: {total_majors}")
        print(f"   📖 Total courses: {total_courses}")
        print(f"   🔗 Courses with prerequisites: {courses_with_prereqs} ({report['summary']['prerequisite_coverage']})")
        print(f"   🤝 Courses with corequisites: {courses_with_coreqs} ({report['summary']['corequisite_coverage']})")
        print(f"\n🏆 Top subjects by course count:")
        for subject, count in top_subjects[:5]:
            print(f"   {subject}: {count} courses")
        
        return report


def main():
    """Main function to run the degree visualization scraper"""
    print("🎓 GMU Degree Visualization Data Scraper")
    print("=" * 50)
    
    scraper = DegreeVisualizationScraper()
    
    # Run the scraping process
    if scraper.scrape_all_degree_data():
        scraper.save_scraped_data()
        scraper.generate_summary_report()
        
        print("\n🎉 Scraping completed successfully!")
        print(f"📁 Data saved in: {scraper.output_dir}")
        print("\n💡 Next steps:")
        print("   1. Update the API to serve the pre-scraped data")
        print("   2. Modify the /see page to use the optimized endpoint")
        print("   3. Set up periodic re-scraping to keep data fresh")
        
    else:
        print("\n❌ Scraping failed. Please check the errors above.")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main()) 