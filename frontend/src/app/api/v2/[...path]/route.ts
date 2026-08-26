import { NextRequest } from 'next/server';
import { javaOrigin, proxyRequest } from '@/lib/backendProxy';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handle(request: NextRequest) {
  return proxyRequest(request, javaOrigin());
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const DELETE = handle;
export const PATCH = handle;
export const OPTIONS = handle;
