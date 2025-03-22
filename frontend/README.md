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

The frontend interacts with the GMU Course API for data retrieval:

- Course data is fetched from `/courses` endpoints
- Major requirements are fetched from `/requirements/majors` endpoints

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
