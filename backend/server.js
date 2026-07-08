const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const { pool, initDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Khởi tạo database
initDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cấu hình thư mục lưu file
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình phục vụ file tĩnh
app.use('/uploads', express.static(uploadDir));

// Cấu hình multer
// TODO: Tích hợp Amazon S3/MinIO sau
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn 10MB
});

// API Endpoint nhận feedback
app.post('/api/feedbacks', upload.array('files'), async (req, res) => {
  try {
    const { title, category, content } = req.body;
    
    // Thu thập danh sách URL của các file đã upload
    const mediaUrls = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

    // Lưu vào database
    const insertQuery = `
      INSERT INTO feedbacks (title, category, content, media_urls)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [title, category, content, JSON.stringify(mediaUrls)];
    const result = await pool.query(insertQuery, values);
    const newFeedback = result.rows[0];

    // Gửi webhook n8n
    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
        try {
            await axios.post(webhookUrl, {
                event: 'new_feedback',
                data: newFeedback
            });
            console.log('Successfully sent data to n8n webhook');
        } catch (webhookErr) {
            console.error('Error sending webhook to n8n:', webhookErr.message);
            // Vẫn tiếp tục xử lý thành công vì webhook có thể fail nhưng record đã vào DB
        }
    }

    res.status(200).json({
      success: true,
      message: 'Gửi phản ánh thành công',
      data: newFeedback
    });

  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý phản ánh',
      error: error.message
    });
  }
});

// Middleware xử lý lỗi tập trung (đặc biệt cho Multer chặn file quá nặng)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Kích thước file vượt quá giới hạn 10MB.' 
      });
    }
    return res.status(400).json({ 
      success: false, 
      message: 'Lỗi tải file: ' + err.message 
    });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
