const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const { protect, isAdmin } = require('../middleware/authMiddleware.js');
const {
  addSubService,
  getAllSubServices,
  getSubServicesByService,
  getSubServiceById,
  updateSubService,
  deleteSubService,
} = require('../Controllers/Subservicecontroller.js');

// ── Upload middleware (mirrors your existing subcategory upload) ──────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/subservices');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    cb(null, allowed.test(path.extname(file.originalname).toLowerCase()));
  },
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
}).fields([
  { name: 'image', maxCount: 1 },
  { name: 'icon',  maxCount: 1 },
]);

// ── Public routes ─────────────────────────────────────────────────────────────
router.get('/',                         getAllSubServices);
router.get('/by-service/:service_id',   getSubServicesByService);
router.get('/:id',                      getSubServiceById);

// ── Admin routes ──────────────────────────────────────────────────────────────
router.post('/',      protect, isAdmin, upload, addSubService);
router.put('/:id',    protect, isAdmin, upload, updateSubService);
router.delete('/:id', protect, isAdmin,         deleteSubService);

module.exports = router;