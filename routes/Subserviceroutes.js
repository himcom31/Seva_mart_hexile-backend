const express    = require('express');
const router     = express.Router();
const multer     = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const { protect, isAdmin } = require('../middleware/authMiddleware.js');
const {
  addSubService,
  getAllSubServices,
  getSubServicesByService,
  getSubServiceById,
  updateSubService,
  deleteSubService,
} = require('../Controllers/Subservicecontroller.js');

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder:         'subservices',
    format:         'webp',
    transformation: [
      file.fieldname === 'icon'
        ? { width: 128, height: 128, crop: 'fill',  quality: 'auto' }
        : { width: 800,              crop: 'limit', quality: 'auto' }
    ],
  }),
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    cb(null, allowed.test(file.mimetype.split('/')[1]));
  },
  limits: { fileSize: 20 * 1024 * 1024 },
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon',  maxCount: 1 },
]);

// Public
router.get('/',                       getAllSubServices);
router.get('/by-service/:service_id', getSubServicesByService);
router.get('/:id',                    getSubServiceById);

// Admin
router.post('/',      protect, isAdmin, upload, addSubService);
router.put('/:id',    protect, isAdmin, upload, updateSubService);
router.delete('/:id', protect, isAdmin,         deleteSubService);

module.exports = router;