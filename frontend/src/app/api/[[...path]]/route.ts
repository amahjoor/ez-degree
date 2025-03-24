import { NextRequest, NextResponse } from 'next/server';

// Get the API base URL from environment variable or default to localhost:8000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// This is a catch-all route handler that proxies requests to the FastAPI backend
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the path from the request
    const path = params.path?.join('/') || '';
    const searchParams = request.nextUrl.searchParams.toString();
    
    // If root /api path with no additional path segments, redirect to docs
    if (!path) {
      return NextResponse.redirect(`${API_BASE_URL}/docs`);
    }
    
    const url = `${API_BASE_URL}/${path}${searchParams ? `?${searchParams}` : ''}`;

    console.log(`Proxying GET request to: ${url}`);

    // Forward the request to the FastAPI backend
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Make sure we're not using cached responses
      cache: 'no-store',
      next: { revalidate: 0 }
    });

    console.log(`Received response from backend with status: ${response.status}`);

    // Handle different content types
    const contentType = response.headers.get('content-type') || '';
    
    // For documentation endpoints (docs, redoc, openapi.json)
    if (path === 'docs' || path === 'redoc' || path === 'openapi.json' || contentType.includes('text/html')) {
      // Redirect to the original backend for documentation
      return NextResponse.redirect(`${API_BASE_URL}/${path}${searchParams ? `?${searchParams}` : ''}`);
    }
    
    // Clone the response before reading the body
    const clonedResponse = response.clone();
    
    // For JSON responses (API data)
    try {
      const data = await clonedResponse.json();
      console.log(`Successfully parsed response as JSON for ${path}:`, data);
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      console.error(`Error parsing JSON response for ${path}:`, error);
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
      { error: 'Failed to fetch data from API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Handle POST requests
export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the path from the request
    const path = params.path?.join('/') || '';
    const url = `${API_BASE_URL}/${path}`;

    console.log(`Proxying POST request to: ${url}`);

    // Clone the request to avoid "Body has already been read" errors
    const clonedRequest = request.clone();
    
    // Get the request body
    const body = await clonedRequest.json();

    // Forward the request to the FastAPI backend
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Clone the response before reading the body
    const clonedResponse = response.clone();
    
    // Read the response body
    try {
      const data = await clonedResponse.json();
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      // If response is not JSON, return the raw text
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'text/plain',
        },
      });
    }
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to send data to API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Handle PUT requests
export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the path from the request
    const path = params.path?.join('/') || '';
    const url = `${API_BASE_URL}/${path}`;

    // Clone the request to avoid "Body has already been read" errors
    const clonedRequest = request.clone();
    
    // Get the request body
    const body = await clonedRequest.json();

    // Forward the request to the FastAPI backend
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    // Clone the response before reading the body
    const clonedResponse = response.clone();
    
    // Read the response body
    try {
      const data = await clonedResponse.json();
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      // If response is not JSON, return the raw text
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'text/plain',
        },
      });
    }
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to update data via API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Handle DELETE requests
export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Get the path from the request
    const path = params.path?.join('/') || '';
    const url = `${API_BASE_URL}/${path}`;

    // Forward the request to the FastAPI backend
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Clone the response before reading the body
    const clonedResponse = response.clone();
    
    // Read the response body
    try {
      const data = await clonedResponse.json();
      return NextResponse.json(data, { status: response.status });
    } catch (error) {
      // If response is not JSON, return the raw text
      const text = await response.text();
      return new NextResponse(text, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('content-type') || 'text/plain',
        },
      });
    }
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data via API', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 