const multer                = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary            = require('../config/cloudinary.js');

const storage = new CloudinaryStorage({
  cloudinary,

  
  params: async (req, file) => ({
    folder:         'services',
    format:         'webp',
    transformation: [
      file.fieldname === 'icon'
        ? { width: 128, height: 128, crop: 'fill',  quality: 'auto' }
        : { width: 800,              crop: 'limit', quality: 'auto' }
    ],
  }),
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  if (allowed.test(file.mimetype.split('/')[1]))
    cb(null, true);
  else
    cb(new Error('Only JPG, PNG, and WebP images are allowed'));
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon',  maxCount: 1 },
]);

// Wrap with error handler so multer errors return clean JSON
module.exports = (req, res, next) => {
  multerUpload(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};