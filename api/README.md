# GMU Course and Requirements API

This API provides access to course information and degree requirements for George Mason University programs.

## API Endpoints

### Root

- `GET /`: Welcome endpoint for the API

### Course Endpoints

- `GET /courses/`: Get all courses with optional filtering
  - Query Parameters:
    - `subject`: Filter by subject code (e.g., 'CS', 'MATH')
    - `search`: Search in course code, title, or description
    - `skip`: Number of records to skip (pagination)
    - `limit`: Number of records to return (pagination)


- `GET /courses/{course_code}`: Get detailed information about a specific course
  - Path Parameters:
    - `course_code`: Course code (e.g., 'CS 110')

- `GET /subjects/`: Get list of all subjects

### Degree Requirements Endpoints

- `GET /requirements/majors`: Get a list of all available majors
  - Response: A JSON object containing an array of majors with their ID and name
  - Example Response:
    ```json
    {
      "majors": [
        {
          "id": "computer_science_bs",
          "name": "Computer Science BS"
        },
        {
          "id": "information_technology_bs",
          "name": "Information Technology BS"
        }
      ]
    }
    ```

- `GET /requirements/majors/{major_id}`: Get detailed requirements for a specific major
  - Path Parameters:
    - `major_id`: ID of the major (e.g., 'computer_science_bs')
  - Response: A JSON object containing degree requirements including categories and courses
  - Example Response:
    ```json
    {
      "degree_name": "Computer Science BS",
      "total_credits": 120.0,
      "categories": [
        {
          "name": "Computer Science Core",
          "total_credits": 35.0,
          "courses": [
            {
              "code": "CS 110",
              "title": "Essentials of Computer Science",
              "credits": 3.0,
              "alternatives": []
            }
          ]
        }
      ]
    }
    ```

## Error Handling

The API returns appropriate HTTP status codes:

- `200 OK`: Request succeeded
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a detail message explaining the error.

## Running the API

```bash
# Start the API server
uvicorn api.main:app --reload
```

## API Documentation

Interactive API documentation is available at:

- Swagger UI: `/docs`
- ReDoc: `/redoc` 