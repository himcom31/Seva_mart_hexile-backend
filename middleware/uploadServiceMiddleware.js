const multer             = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary         = require('../config/cloudinary');

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

module.exports = multer({
  storage,
  fileFilter,
  limits: { fileSize: 20 * 1024 * 1024 }
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon',  maxCount: 1 }
]);