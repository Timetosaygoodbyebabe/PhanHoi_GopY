export const config = {
  matcher: '/(.*)',
};

export default function middleware(request) {
  // Bắt các yêu cầu OPTIONS (Preflight) và trả về 200 OK ngay lập tức
  // Điều này giúp Bypass tường lửa 403 Forbidden của máy chủ Đà Nẵng
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
}
