const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return callback(new Error('Receipt must be a JPG, PNG, WebP, or PDF file.'));
    }
    callback(null, true);
  },
});
module.exports = upload;
