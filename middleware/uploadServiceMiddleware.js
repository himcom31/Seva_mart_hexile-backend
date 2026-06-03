const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const uploadDir = path.join(__dirname, '../uploads/services');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png/;
  if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype))
    cb(null, true);
  else
    cb(new Error('Only JPG and PNG images are allowed'));
};

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon',  maxCount: 1 }
]);