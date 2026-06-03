const Category   = require('../models/Services/Category.js');
const cloudinary = require('../config/cloudinary');

const generateSlug = (name) =>
  name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

// Extract Cloudinary public_id from URL for deletion
const getPublicId = (url) => {
  if (!url) return null;
  const parts = url.split('/');
  const uploadIndex = parts.indexOf('upload');
  if (uploadIndex === -1) return null;
  return parts.slice(uploadIndex + 2).join('/').replace(/\.[^/.]+$/, '');
};

// @desc   Add Category
// @route  POST /api/categories
// @access Private (Admin)
exports.addCategory = async (req, res) => {
  try {
    const { language, name, slug, description, status, featured } = req.body;

    if (!name) return res.status(400).json({ message: 'Category name is required' });

    const finalSlug = slug || generateSlug(name);

    const existing = Category.findBySlug(finalSlug);
    if (existing)
      return res.status(409).json({ message: `Slug "${finalSlug}" already exists.` });

    // Cloudinary returns full URL in file.path
    const image = req.files?.image?.[0]?.path || null;
    const icon  = req.files?.icon?.[0]?.path  || null;

    const category = Category.create({
      language: language || 'en',
      name,
      slug: finalSlug,
      image,
      icon,
      description,
      status:   status   || 'active',
      featured: featured === 'true' || featured === true ? 1 : 0
    });

    res.status(201).json({ success: true, message: 'Category created successfully', category });
  } catch (err) {
    console.error('Add Category Error:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get All Categories
// @route  GET /api/categories
// @access Public
exports.getAllCategories = (req, res) => {
  try {
    const categories = Category.findAll();
    res.status(200).json({ success: true, count: categories.length, categories });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Get Single Category
// @route  GET /api/categories/:id
// @access Public
exports.getCategoryById = (req, res) => {
  try {
    const category = Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });
    res.status(200).json({ success: true, category });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Update Category
// @route  PUT /api/categories/:id
// @access Private (Admin)
exports.updateCategory = async (req, res) => {
  try {
    const category = Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    const { language, name, slug, description, status, featured } = req.body;

    let image = category.image;
    let icon  = category.icon;

    // Delete old Cloudinary image and save new URL
    if (req.files?.image?.[0]) {
      const oldId = getPublicId(category.image);
      if (oldId) await cloudinary.uploader.destroy(oldId);
      image = req.files.image[0].path;
    }

    if (req.files?.icon?.[0]) {
      const oldId = getPublicId(category.icon);
      if (oldId) await cloudinary.uploader.destroy(oldId);
      icon = req.files.icon[0].path;
    }

    const updated = Category.update(req.params.id, {
      language: language || category.language,
      name:     name     || category.name,
      slug:     slug     || category.slug,
      image,
      icon,
      description: description ?? category.description,
      status:   status   || category.status,
      featured: featured !== undefined ? (featured === 'true' ? 1 : 0) : category.featured
    });

    res.status(200).json({ success: true, message: 'Category updated', category: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

// @desc   Delete Category
// @route  DELETE /api/categories/:id
// @access Private (Admin)
exports.deleteCategory = async (req, res) => {
  try {
    const category = Category.findById(req.params.id);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    // Delete both image and icon from Cloudinary
    for (const field of ['image', 'icon']) {
      const publicId = getPublicId(category[field]);
      if (publicId) await cloudinary.uploader.destroy(publicId);
    }

    Category.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};