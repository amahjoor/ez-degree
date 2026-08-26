import { NextRequest, NextResponse } from 'next/server';

export function javaOrigin(): string {
  return process.env.JAVA_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
}

export function pythonOrigin(): string {
  return process.env.PYTHON_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
}

export async function proxyRequest(request: NextRequest, targetBase: string): Promise<NextResponse> {
  const incoming = new URL(request.url);
  const target = `${targetBase}${incoming.pathname}${incoming.search}`;
  const headers = new Headers();
  const authorization = request.headers.get('authorization');
  if (authorization) headers.set('Authorization', authorization);
  const contentType = request.headers.get('content-type');
  if (contentType) headers.set('Content-Type', contentType);

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = await request.arrayBuffer();
  }

  const response = await fetch(target, init);
  const responseHeaders = new Headers();
  const responseType = response.headers.get('content-type');
  if (responseType) responseHeaders.set('Content-Type', responseType);

  return new NextResponse(await response.arrayBuffer(), {
    status: response.status,
    headers: responseHeaders,
  });
}
