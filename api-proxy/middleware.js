export const config = {
  matcher: '/(.*)',
};

export default function middleware(request) {
  // Bắt các yêu cầu OPTIONS (Preflight) và trả về 200 OK ngay lập tức
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

  // Các request POST/GET khác: Ghi đè Origin để qua mặt tường lửa của máy chủ Đà Nẵng
  // Tường lửa Đà Nẵng sẽ báo lỗi "Invalid CORS request" nếu thấy Origin là localhost hoặc Zalo
  return new Response(null, {
    headers: {
      'x-middleware-next': '1', // Lệnh bắt buộc để Vercel tiếp tục chuyển tiếp request
      'x-middleware-request-origin': 'https://gopy.danang.gov.vn',
      'x-middleware-request-referer': 'https://gopy.danang.gov.vn/'
    }
  });
}
