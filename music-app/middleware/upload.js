const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads/songs directory exists
const uploadDir = path.join(__dirname, '../uploads/songs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${require('uuid').v4()}.${fileExt}`;
    cb(null, fileName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['audio/mpeg', 'audio/wav'];
  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('Chỉ hỗ trợ file MP3 hoặc WAV'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

module.exports = upload;