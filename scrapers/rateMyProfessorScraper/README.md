# RateMyProfessor Scraper

This module scrapes professor ratings from RateMyProfessor.com to provide difficulty data for courses at George Mason University.

## Features

- Retrieves professor ratings from RateMyProfessor
- Calculates average course difficulty based on professor ratings
- Categorizes difficulty levels (Easy, Moderate, Difficult)
- Saves data in JSON format for use in the iWannaGraduate application

## Usage

```bash
# Make sure you have the required library installed
pip install git+https://github.com/Nobelz/RateMyProfessorAPI.git

# Run the scraper
python scrapers/rateMyProfessorScraper/rateMyProfessorScraper.py
```

## Output

The scraper generates two JSON files:

1. `data/professors/professor_ratings.json` - Contains raw professor rating data from RateMyProfessor
2. `data/professors/course_difficulty.json` - Contains aggregated course difficulty data

### Sample Course Difficulty Data Format

```json
{
  "CS 310": {
    "professors": [
      {
        "name": "Mark Snyder",
        "difficulty": 3.8,
        "rating": 4.7
      },
      {
        "name": "Shai Vardi",
        "difficulty": 3.2,
        "rating": 4.3
      }
    ],
    "average_difficulty": 3.5,
    "difficulty_level": "Moderate",
    "num_professors_rated": 2
  }
}
```

## Integration with iWannaGraduate

This data can be used to enhance course listings in the application by:

1. Displaying difficulty levels on course cards
2. Allowing filtering/sorting by difficulty
3. Showing professor-specific difficulty details on course detail pages

## Note

This scraper uses a rate-limiting mechanism to avoid being blocked by RateMyProfessor. Please use it responsibly.

## Future Improvements

- Extract professors directly from course data
- Implement concurrent processing for faster scraping
- Add more nuanced difficulty metrics
- Store historical difficulty data over time 