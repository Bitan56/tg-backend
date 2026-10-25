const multer = require('multer');

// Vercel's filesystem is read-only, so keep files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 }, // 5MB each, max 8
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPG, PNG or WebP images are allowed'));
  },
});

// Field name must match frontend: data.append('images', file)
module.exports = upload.array('images', 8);
