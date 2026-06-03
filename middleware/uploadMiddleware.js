const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure upload folder exists
const uploadDir = path.join(__dirname, '../uploads/categories');
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
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('Only JPG and PNG images are allowed'));
};

const upload = multer({
  storage,
  fileFilter,
limits: { fileSize: 20 * 1024 * 1024 } // ✅ 15 MB exactly

});

// Accepts both 'image' and 'icon' fields
module.exports = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon',  maxCount: 1 }
]);