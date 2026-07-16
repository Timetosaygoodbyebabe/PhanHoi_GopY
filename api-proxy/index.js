const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// Bypass CORS cho tất cả các request
app.use(cors());

const TARGET_DOMAIN = 'https://gopy.danang.gov.vn';

// Sử dụng http-proxy-middleware để forward mọi request một cách nguyên bản nhất (kể cả ảnh, video, form-data)
app.use('/api/gopy', createProxyMiddleware({
  target: TARGET_DOMAIN,
  changeOrigin: true,
  onProxyReq: (proxyReq, req, res) => {
    // Forward headers nếu cần thiết
  }
}));

app.use('/base-api/public/file', createProxyMiddleware({
  target: TARGET_DOMAIN,
  changeOrigin: true,
  // Tăng giới hạn timeout cho video tải lâu
  proxyTimeout: 60000,
  timeout: 60000,
}));

app.get('/', (req, res) => {
  res.send('CORS Proxy Server cho Cổng Góp Ý Đà Nẵng đang hoạt động! Đã hỗ trợ tải Video/Ảnh.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Proxy server đang chạy tại port ${PORT}`);
});

module.exports = app;
