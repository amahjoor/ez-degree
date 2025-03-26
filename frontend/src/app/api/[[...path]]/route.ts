import { NextRequest, NextResponse } from 'next/server';

// Get the API base URL from environment variable or default to localhost:8000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Helper function to clean path and build URL
function buildUrl(path: string, searchParams?: string) {
  // Remove leading and trailing slashes, then join with single slashes
  const cleanPath = path.replace(/^\/+|\/+$/g, '');
  const baseUrl = API_BASE_URL.replace(/\/+$/, '');
  const url = cleanPath
    ? `${baseUrl}/${cleanPath}${searchParams ? `?${searchParams}` : ''}`
    : baseUrl;
  return url;
}

// This is a catch-all route handler that proxies requests to the FastAPI backend
export async function GET(request: NextRequest) {
  try {
    // Get the path from the request URL
    const path = request.nextUrl.pathname.replace(/^\/api\/?/, '');
    const searchParams = request.nextUrl.searchParams.toString();
    
    // If root /api path with no additional path segments, redirect to docs
    if (!path) {
      return NextResponse.redirect(`${API_BASE_URL}/docs`);
    }
    
    const url = buildUrl(path, searchParams);
    console.log(`Proxying GET request to: ${url}`);

    // Forward the request to the FastAPI backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Handle different content types
    const contentType = response.headers.get('content-type') || '';
    
    // For documentation endpoints (docs, redoc, openapi.json)
    if (path === 'docs' || path === 'redoc' || path === 'openapi.json' || contentType.includes('text/html')) {
      // Redirect to the original backend for documentation
      return NextResponse.redirect(buildUrl(path, searchParams));
    }
    
    // For JSON responses (API data)
    try {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      // If response is not JSON, return the raw text
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          'Content-Type': contentType,
        },
      });
    }
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from API' },
      { status: 500 }
    );
  }
}

// Handle POST requests
export async function POST(request: NextRequest) {
  try {
    // Get the path from the request URL
    const path = request.nextUrl.pathname.replace(/^\/api\/?/, '');
    const url = buildUrl(path);

    console.log(`Proxying POST request to: ${url}`);

    // Get the request body
    const body = await request.json();

    // Forward the request to the FastAPI backend
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Read the response body
    const data = await response.json();

    // Return the response from the FastAPI backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to send data to API' },
      { status: 500 }
    );
  }
}

// Handle PUT requests
export async function PUT(request: NextRequest) {
  try {
    // Get the path from the request URL
    const path = request.nextUrl.pathname.replace(/^\/api\/?/, '');
    const url = buildUrl(path);

    console.log(`Proxying PUT request to: ${url}`);

    // Get the request body
    const body = await request.json();

    // Forward the request to the FastAPI backend
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Read the response body
    const data = await response.json();

    // Return the response from the FastAPI backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to send data to API' },
      { status: 500 }
    );
  }
}

// Handle DELETE requests
export async function DELETE(request: NextRequest) {
  try {
    // Get the path from the request URL
    const path = request.nextUrl.pathname.replace(/^\/api\/?/, '');
    const url = buildUrl(path);

    console.log(`Proxying DELETE request to: ${url}`);

    // Forward the request to the FastAPI backend
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Read the response body
    const data = await response.json();

    // Return the response from the FastAPI backend
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data via API' },
      { status: 500 }
    );
  }
} 