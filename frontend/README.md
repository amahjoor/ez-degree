# iWannaGraduate Frontend

A Next.js frontend for the iWannaGraduate application, helping GMU students plan their path to graduation.

## Features

- **Course Search**: Browse and search GMU courses by subject, keyword, or course code
- **Course Details**: View detailed information about specific courses
- **Degree Requirements**: Explore the requirements for various majors at GMU
  - View all available majors
  - See detailed requirement categories and courses for each major
  - Interactive UI with collapsible sections

## Pages

- `/` - Home page with links to main features
- `/courses` - Course search and browse page
- `/courses/[course_code]` - Detailed view of a specific course
- `/requirements` - Degree requirements explorer

## Getting Started

### Prerequisites

- Node.js 14+ and npm

### Installation

```bash
# Install dependencies
npm install
```

### Development

```bash
# Start the development server
npm run dev
```

This will start the Next.js development server at [http://localhost:3000](http://localhost:3000).

### Build for Production

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## API Integration

The frontend application communicates with the GMU Course API for data retrieval. There are two ways to access the API:

1. **Direct API Access** (Backend development): 
   - The API server runs at `http://localhost:8000`
   - Access OpenAPI documentation at `http://localhost:8000/docs`

2. **API Proxy** (Frontend development):
   - For convenience, the API is also available at `http://localhost:3000/api`
   - This proxy forwards requests to the backend API server
   - Example: `http://localhost:3000/api/courses` forwards to `http://localhost:8000/courses`

### API Endpoints

The application uses the following key endpoints:

- Course Data:
  - GET `/api/courses` - List all courses with pagination and filtering
  - GET `/api/courses/{course_code}` - Get details for a specific course
  - GET `/api/subjects` - List all available subjects

- Degree Requirements:
  - GET `/api/requirements/majors` - List all available majors
  - GET `/api/requirements/majors/{major_id}` - Get detailed requirements for a specific major

## Environment Variables

Create a `.env.local` file in the frontend directory with:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Technologies

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
