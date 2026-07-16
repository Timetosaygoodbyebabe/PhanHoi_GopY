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

  const url = new URL(request.url);
  const targetUrl = 'https://gopy.danang.gov.vn' + url.pathname + url.search;

  return new Response(null, {
    headers: {
      'x-middleware-rewrite': targetUrl,
      'x-middleware-request-origin': 'https://gopy.danang.gov.vn',
      'x-middleware-request-referer': 'https://gopy.danang.gov.vn/'
    }
  });
}
