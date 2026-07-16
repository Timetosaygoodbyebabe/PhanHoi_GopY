import { rewrite } from '@vercel/edge';

export const config = {
  matcher: '/(.*)',
};

export default function middleware(request) {
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  // Clone headers and modify them
  const headers = new Headers(request.headers);
  headers.set('origin', 'https://gopy.danang.gov.vn');
  headers.set('referer', 'https://gopy.danang.gov.vn/');

  // Determine target URL
  const url = new URL(request.url);
  const targetUrl = 'https://gopy.danang.gov.vn' + url.pathname + url.search;

  // Use rewrite() from @vercel/edge to proxy to external URL natively
  return rewrite(targetUrl, {
    request: {
      headers
    }
  });
}
