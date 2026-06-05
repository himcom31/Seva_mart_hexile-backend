const cloudinary = require('./cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'Re/Products',
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation:  [{ width: 1280, height: 960, crop: 'limit' }],
  },
});

module.exports = multer({ storage });