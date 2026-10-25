const multer = require('multer');

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, callback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.mimetype)) {
      return callback(new Error('Package images must be JPG, PNG, or WebP files.'));
    }
    callback(null, true);
  },
});
